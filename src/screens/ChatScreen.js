// src/screens/ChatScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    Image,
    Linking
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';

// --- Import Components ---
import TopicsSidebar from '../components/TopicsSidebar';
import SaveFAQModal from '../components/SaveFAQModal'; 
import RatingModal from '../components/RatingModal';

// --- Import Utilities ---
import { sendMessage } from '../utils/chatServices';
import { uploadFile } from '../utils/firebaseUpload'; 
import { startRecording, stopRecording } from '../utils/media'; 
import { pickMediaFile, getMessageType } from '../utils/mediaPicker'; 
import { useUserCache } from '../utils/userServices'; 
import { logError } from '../utils/errorLogger'; // <-- NEW: Error Handling Utility

// --- Import Constants (Assuming Phase 19.1 is complete) ---
// NOTE: These constants must exist in src/constants/index.js for the code to run
import { COLLECTIONS, CHAT_TYPES, MESSAGE_TYPES, USER_ROLES, DOUBT_STATUS, DEFAULT_GROUP_TOPIC } from '../constants';


const ChatScreen = ({ navigation }) => {
    const route = useRoute();
    const { chatId, chatType, chatTitle, initialTopicId = DEFAULT_GROUP_TOPIC } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    
    // --- TOPIC/VIEW STATE ---
    const [currentTopicId, setCurrentTopicId] = useState(initialTopicId);
    const [currentViewMode, setCurrentViewMode] = useState('chat');
    
    // --- MODAL STATES ---
    const [faqModalVisible, setFaqModalVisible] = useState(false);
    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [doubtInfo, setDoubtInfo] = useState({ doubtId: null, facultyId: null, paperId: null });
    
    const flatListRef = useRef(null);
    const currentUserId = auth.currentUser?.uid;
    
    const isGroupChat = chatType === CHAT_TYPES.GROUP; 
    const isDoubtChat = chatType === CHAT_TYPES.DOUBT;
    
    const currentUserRole = auth.currentUser?.role;
    const isStaff = [USER_ROLES.FACULTY, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TECHNICAL_SUPPORT, USER_ROLES.COORDINATOR].includes(currentUserRole);

    // --- Message Listener (Using Constants) ---
    useEffect(() => {
        if (!chatId || !chatType || !currentUserId) {
             setLoading(false);
             return;
        }

        let collectionPath;
        let queryRef;

        if (currentViewMode === 'faq') {
            // Using constants for path construction
            collectionPath = `${COLLECTIONS.PAPERS}/${chatId}/${COLLECTIONS.TOPICS_SUB}/${currentTopicId}/${COLLECTIONS.FAQS_SUB}`;
            queryRef = db.collection(collectionPath).orderBy("provenance.savedAt", "desc");
            
        } else {
             switch (chatType) {
                case CHAT_TYPES.DOUBT:
                    collectionPath = COLLECTIONS.MESSAGES;
                    queryRef = db.collection(collectionPath).where('doubtId', '==', chatId).orderBy('timestamp');
                    break;
                case CHAT_TYPES.GROUP:
                    collectionPath = COLLECTIONS.PAPER_MESSAGES;
                    queryRef = db.collection(collectionPath)
                        .where('paperId', '==', chatId)
                        .where('topicId', '==', currentTopicId)
                        .orderBy('timestamp');
                    break;
                case CHAT_TYPES.DM:
                    collectionPath = `${COLLECTIONS.CONVERSATIONS}/${chatId}/${COLLECTIONS.MESSAGES_SUB}`;
                    queryRef = db.collection(collectionPath).orderBy('timestamp');
                    break;
                case CHAT_TYPES.SUPPORT:
                    collectionPath = `${COLLECTIONS.SUPPORT_CONVERSATIONS}/${chatId}/${COLLECTIONS.MESSAGES_SUB}`;
                    queryRef = db.collection(collectionPath).orderBy('timestamp');
                    break;
                default:
                    setLoading(false);
                    return;
            }
        }

        const unsubscribe = queryRef.onSnapshot(querySnapshot => {
            const fetchedItems = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(), 
            }));
            
            setMessages(fetchedItems);
            setLoading(false);
        }, error => {
            logError(error, `ChatListener:${chatType}`, `Failed to load ${currentViewMode}.`); // <-- USING logError
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId, chatType, currentTopicId, currentViewMode, currentUserId]);
    
    // --- Check for Rating Prompt (Student side) ---
    useEffect(() => {
        if (isDoubtChat && !isStaff && chatId) {
            const doubtRef = db.collection(COLLECTIONS.DOUBTS).doc(chatId);
            const unsubscribe = doubtRef.onSnapshot(doc => {
                const data = doc.data();
                if (data && data.status === DOUBT_STATUS.RESOLVED && !data.rated && data.assignedFacultyId) {
                    setDoubtInfo({ doubtId: chatId, facultyId: data.assignedFacultyId, paperId: data.paperId });
                    setRatingModalVisible(true);
                }
            }, error => {
                logError(error, "RatingPromptListener", "Could not check doubt status."); // <-- USING logError
            });
            return () => unsubscribe();
        }
    }, [isDoubtChat, isStaff, chatId]);


    // --- Text Send Handler ---
    const handleSend = async () => {
        const text = inputMessage.trim();
        if (!text) return;

        setInputMessage('');
        
        try {
            await sendMessage(chatId, chatType, text, MESSAGE_TYPES.TEXT, null, null, currentTopicId);
        } catch (error) {
            logError(error, "TextSendHandler", "Failed to send message."); // <-- USING logError
            setInputMessage(text);
        }
    };
    
    // --- Media/Audio Handlers (Using logError) ---
    const handleAttachMedia = async () => {
        const fileInfo = await pickMediaFile();
        if (!fileInfo) return;
        setLoading(true);
        try {
            const downloadURL = await uploadFile(fileInfo.uri, `${chatType}-files/${chatId}`);
            const type = getMessageType(fileInfo.mimeType);
            await sendMessage(chatId, chatType, downloadURL, type, fileInfo.name, null, currentTopicId);
        } catch (error) { 
            logError(error, "MediaUpload", "Failed to upload file.");
        } finally { 
            setLoading(false); 
        }
    };

    const handleRecordAudio = async () => {
        if (isRecording) {
            setIsRecording(false);
            setLoading(true);
            try {
                const localUri = await stopRecording();
                if (localUri) {
                    const downloadURL = await uploadFile(localUri, `audio-messages/${chatId}`);
                    await sendMessage(chatId, chatType, downloadURL, MESSAGE_TYPES.AUDIO, `voice_note_${Date.now()}.webm`, null, currentTopicId);
                }
            } catch (error) { 
                logError(error, "AudioRecording", "Failed to send audio.");
            } finally { 
                setLoading(false); 
            }
        } else {
            const started = await startRecording();
            if (started) { setIsRecording(true); }
        }
    };

    // --- Opens Save FAQ Modal and prepares text ---
    const openSaveFAQModal = (questionMessage, startIndex) => {
        if (!isGroupChat || !isStaff || questionMessage.messageType !== MESSAGE_TYPES.TEXT) return;
        
        setFaqQuestion(questionMessage.content);
        
        let answer = '';
        const limit = Math.min(messages.length, startIndex + 5); 

        for (let i = startIndex + 1; i < limit; i++) {
            const nextMsg = messages[i];
            
            if (nextMsg.messageType === MESSAGE_TYPES.TEXT && nextMsg.senderId !== MESSAGE_TYPES.SYSTEM) {
                const nextSenderData = useUserCache(nextMsg.senderId);
                answer += `${nextSenderData?.displayName || nextMsg.senderId}: ${nextMsg.content}\n\n`;
            }
        }
        setFaqAnswer(answer.trim());
        setFaqModalVisible(true);
    };
    
    // --- Mark Doubt as Resolved (Staff side) ---
    const handleMarkAsResolved = async () => {
        if (!isDoubtChat || !isStaff) return;
        
        Alert.alert(
            "Resolve Doubt",
            "Are you sure you want to mark this doubt as resolved? This will prompt the student for a rating.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Resolve", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await db.collection(COLLECTIONS.DOUBTS).doc(chatId).update({
                                status: DOUBT_STATUS.RESOLVED,
                                resolvedBy: currentUserId,
                                resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            
                            await sendMessage(chatId, chatType, 'This doubt has been marked as resolved.', MESSAGE_TYPES.SYSTEM, null, null, null);
                            Alert.alert("Success", "Doubt resolved. Student can now rate the service.");
                        } catch (error) {
                            logError(error, "ResolveDoubt", "Failed to mark doubt as resolved.");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };


    // --- Message Renderer (Handles Chat and FAQ view items) ---
    const renderMessage = React.useCallback(({ item, index }) => { // <-- USED useCallback for FlatList performance
        // --- FAQ RENDER MODE ---
        if (currentViewMode === 'faq') {
            const answerMediaUrl = item.answerMediaUrl;
            const mediaType = item.answerMediaType;
             
            const renderAnswerContent = () => {
                if (item.answerText) return <Text style={styles.faqAnswer}>{item.answerText}</Text>;
                if (mediaType === MESSAGE_TYPES.IMAGE) return <Image source={{ uri: answerMediaUrl }} style={styles.faqMediaImage} />;
                if (mediaType === MESSAGE_TYPES.AUDIO) return <Text style={styles.faqAnswer}>▶️ Audio Note</Text>;
                return <Text style={styles.faqAnswer}>[Content: {mediaType}]</Text>;
            };
             
            return (
                <View style={styles.faqCard}>
                    <Text style={styles.faqQuestion}>{item.questionText}</Text>
                    <View style={styles.faqAnswerContainer}>
                        {renderAnswerContent()}
                    </View>
                    <Text style={styles.faqProvenance}>Saved by: {item.provenance?.savedById?.substring(0, 8)}...</Text>
                </View>
            );
        }

        // --- CHAT MESSAGE RENDER MODE ---
        const isSender = item.senderId === currentUserId;
        const senderData = useUserCache(item.senderId); 
        
        const isActionable = isGroupChat && isStaff && item.messageType === MESSAGE_TYPES.TEXT;

        const handleFileOpen = async (url) => {
            try {
                const supported = await Linking.canOpenURL(url);
                if (supported) { await Linking.openURL(url); } else { Alert.alert(`Don't know how to open this URL: ${url}`); }
            } catch (e) { logError(e, "FileOpen", "Could not open file URL."); }
        };

        const renderContent = () => {
            switch (item.messageType) {
                case MESSAGE_TYPES.TEXT: return <Text style={isSender ? styles.senderText : styles.receiverText}>{item.content}</Text>;
                case MESSAGE_TYPES.IMAGE: return (<TouchableOpacity onPress={() => handleFileOpen(item.content)}><Image source={{ uri: item.content }} style={styles.mediaImage} /></TouchableOpacity>);
                case MESSAGE_TYPES.AUDIO: return (<TouchableOpacity style={styles.audioBubble} onPress={() => Alert.alert("Audio Playback", "This is a placeholder for audio playback.")}><Text style={styles.audioText}>{isSender ? '▶️ Voice Note' : '🎙️ Voice Note'}</Text></TouchableOpacity>);
                case MESSAGE_TYPES.FILE:
                case MESSAGE_TYPES.VIDEO: return (<TouchableOpacity style={styles.fileBubble} onPress={() => handleFileOpen(item.content)}><Text style={styles.fileText}>⬇️ {item.fileName || 'Download File'}</Text></TouchableOpacity>);
                default: return <Text style={isSender ? styles.senderText : styles.receiverText}>[Unsupported Type]</Text>;
            }
        };

        return (
            <TouchableOpacity 
                style={[styles.messageRow, isSender ? styles.senderRow : styles.receiverRow]}
                onLongPress={isActionable ? () => openSaveFAQModal(item, index) : null}
                activeOpacity={isActionable ? 0.7 : 1}
            >
                {!isSender && (
                     <View style={styles.avatarContainer}>
                        <Image source={{ uri: senderData.photoURL }} style={styles.avatar} />
                    </View>
                )}

                <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
                    
                    {!isSender && <Text style={styles.senderName}>{senderData.displayName}</Text>}
                    
                    {renderContent()}
                    
                    <Text style={[styles.timestamp, isSender ? styles.senderTimestamp : styles.receiverTimestamp]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                 
                {isSender && <View style={styles.avatarContainer} />} 
            </TouchableOpacity>
        );
    }, [currentViewMode, currentUserId, isGroupChat, isStaff, messages]); // <-- Dependencies

    if (loading && messages.length === 0) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    return (
        <View style={styles.chatLayoutContainer}>
            {/* 1. Topics Sidebar (visible only for Group Chats) */}
            {isGroupChat && (
                <TopicsSidebar
                    paperId={chatId}
                    currentTopicId={currentTopicId}
                    setCurrentTopicId={setCurrentTopicId}
                    currentViewMode={currentViewMode}
                    setCurrentViewMode={setCurrentViewMode}
                />
            )}

            {/* 2. Main Chat/FAQ Area */}
            <View style={styles.mainChatArea}>
                {/* Custom Header: With Resolve Button */}
                <View style={styles.customHeader}>
                    <Text style={styles.chatTitle}>{chatTitle} / {currentViewMode === 'faq' ? 'FAQs' : currentTopicId}</Text>
                    {isDoubtChat && isStaff && (
                         <TouchableOpacity style={styles.resolveButton} onPress={handleMarkAsResolved}>
                            <Text style={styles.resolveButtonText}>✅ Resolve Doubt</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    
                    // --- PERFORMANCE OPTIMIZATION (Phase 19.2) ---
                    // Assuming an average message height of 100 units
                    getItemLayout={(data, index) => ({
                        length: 100, 
                        offset: 100 * index, 
                        index
                    })}
                    // ---------------------------------------------
                    
                    onContentSizeChange={() => currentViewMode === 'chat' && flatListRef.current.scrollToEnd({ animated: true })}
                />

                {/* Input Area (Only visible in Chat Mode) */}
                {currentViewMode === 'chat' && (
                    <View style={styles.inputContainer}>
                        
                         <TouchableOpacity style={styles.actionButton} onPress={handleAttachMedia} disabled={isRecording}>
                            <Text style={styles.actionText}>📎</Text>
                        </TouchableOpacity>
                         
                         <TouchableOpacity 
                            style={[styles.actionButton, isRecording && styles.recordingButton]} 
                            onPress={handleRecordAudio}
                        >
                            <Text style={styles.actionText}>{isRecording ? '🛑' : '🎙️'}</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.input}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            placeholder={isRecording ? "Recording in progress..." : "Type your message..."}
                            multiline={true}
                            editable={!isRecording}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isRecording || inputMessage.trim() === ''}>
                            <Text style={styles.sendText}>➤</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            
            {/* --- Modals Rendered Here --- */}
            <SaveFAQModal
                isVisible={faqModalVisible}
                onClose={() => setFaqModalVisible(false)}
                paperId={chatId}
                topicId={currentTopicId}
                initialQuestion={faqQuestion}
                initialAnswer={faqAnswer}
            />
            <RatingModal
                isVisible={ratingModalVisible}
                onClose={() => setRatingModalVisible(false)}
                {...doubtInfo}
                studentId={currentUserId}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center' },
    
    // --- Structural Layout ---
    chatLayoutContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f3f4f6' },
    mainChatArea: { flex: 1 },
    
    // --- Custom Header/Resolve Button Styles ---
    customHeader: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    chatTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    resolveButton: {
        backgroundColor: '#22c55e', // Green
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    resolveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    // --- Chat List Styles ---
    messageList: { flex: 1 },
    messageListContent: { paddingVertical: 10 },
    messageRow: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 10 },
    senderRow: { justifyContent: 'flex-end', marginLeft: 40 },
    receiverRow: { justifyContent: 'flex-start', marginRight: 40 },
    systemMessageRow: { width: '100%', alignItems: 'center', marginVertical: 5 },
    
    // --- Bubble Styles ---
    messageBubble: {
        maxWidth: '100%', 
        padding: 10,
        borderRadius: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    senderBubble: { backgroundColor: '#ec4899', borderBottomRightRadius: 2 },
    receiverBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2 },
    
    // --- Text/Avatar Styles ---
    avatarContainer: { width: 30, height: 30, marginHorizontal: 5, alignSelf: 'flex-end' },
    avatar: { width: '100%', height: '100%', borderRadius: 15, resizeMode: 'cover' },
    senderName: { fontSize: 12, fontWeight: 'bold', color: '#db2777', marginBottom: 2 },
    senderText: { color: 'white', fontSize: 16 },
    receiverText: { color: 'black', fontSize: 16 },
    systemText: { fontStyle: 'italic', color: '#6b7280', fontSize: 12, paddingHorizontal: 10 },
    timestamp: { fontSize: 10, textAlign: 'right', marginTop: 5 },
    senderTimestamp: { color: 'rgba(255,255,255,0.7)' },
    receiverTimestamp: { color: '#6b7280' },
    
    // --- Media Styles ---
    recordingButton: { backgroundColor: '#dc2626', borderRadius: 20 },
    mediaImage: { width: 200, height: 150, borderRadius: 8, resizeMode: 'cover', marginVertical: 5 },
    audioBubble: { padding: 10, backgroundColor: '#10b981', borderRadius: 8, marginVertical: 5, minWidth: 150 },
    audioText: { color: 'white', fontWeight: '600' },
    fileBubble: { padding: 10, backgroundColor: '#f97316', borderRadius: 8, marginVertical: 5, minWidth: 150 },
    fileText: { color: 'white', fontWeight: 'bold', textDecorationLine: 'underline' },

    // --- FAQ Styles ---
    faqCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        marginHorizontal: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#db2777',
        shadowOpacity: 0.1,
        elevation: 1,
    },
    faqQuestion: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#db2777',
        marginBottom: 5,
    },
    faqAnswerContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 8,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#4b5563',
    },
    faqMediaImage: {
        width: 150, 
        height: 100, 
        borderRadius: 4, 
        resizeMode: 'cover',
        marginVertical: 5,
    },
    faqProvenance: {
        fontSize: 10,
        color: '#a1a1aa',
        textAlign: 'right',
        marginTop: 5,
    },

    // --- Input Styles ---
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100, 
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: 10, 
        paddingBottom: 10,
        marginHorizontal: 8,
    },
    actionButton: { padding: 5, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 24, color: '#6b7280' },
    sendButton: {
        backgroundColor: '#f97316', 
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    sendText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        transform: [{ rotate: '-45deg' }], 
        marginLeft: -2,
        marginTop: -2,
    },
});

export default ChatScreen;