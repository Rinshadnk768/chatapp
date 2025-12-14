// src/hooks/useSLATimer.js

import { useState, useEffect } from 'react';

/**
 * Hook to manage a single countdown timer based on a deadline timestamp.
 * @param {number|null} deadlineMillis - The UNIX timestamp (in milliseconds) of the deadline.
 * @returns {string} - Formatted time left string.
 */
export const useSLATimer = (deadlineMillis) => {
    const [timeLeft, setTimeLeft] = useState('Loading...');

    useEffect(() => {
        if (!deadlineMillis) {
            setTimeLeft('N/A');
            return;
        }

        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = deadlineMillis - now;

            if (distance < 0) {
                return "SLA Breached";
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                return `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        };

        // Initialize immediately
        setTimeLeft(calculateTime());

        // Set up the interval timer
        const intervalId = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 1000);

        // Cleanup the interval on component unmount
        return () => clearInterval(intervalId);

    }, [deadlineMillis]);

    return timeLeft;
};