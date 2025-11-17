/**
 * API Configuration for Mobile App
 *
 * IMPORTANT: When running on a physical device or emulator,
 * you MUST use your computer's IP address, NOT localhost.
 *
 * To find your IP address:
 * - Windows: Run 'ipconfig' in terminal, look for IPv4 Address
 * - Mac/Linux: Run 'ifconfig' or 'ip addr', look for inet address
 *
 * Example: 192.168.1.100, 10.66.94.244, etc.
 */

// Change this to your computer's local IP address
const API_BASE_URL = 'http://10.66.94.244:3001';

export default {
  API_BASE_URL,
  API_TIMEOUT: 10000,
  // Add other API-related config here
};
