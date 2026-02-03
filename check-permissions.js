/**
 * Permission Checker Script
 * 
 * Run this script to check what permissions are available in the backend
 * and compare them with what you're trying to send.
 * 
 * Usage:
 * 1. Make sure you have a valid auth token
 * 2. Run: node check-permissions.js
 */

const axios = require('axios');

const API_URL = 'https://api.smartclinic.software/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with your actual token

// The permissions you're trying to send
const attemptedPermissions = [
  "create-patient",
  "edit-patient",
  "search-patient",
  "create-bill",
  "mark-bill-paid",
  "create-reservation",
  "edit-reservation",
  "delete-reservation",
  "view-clinic-patients",
  "view-clinic-bills",
  "view-clinic-reservations",
  "view-all-bills",
  "edit-bill"
];

async function checkPermissions() {
  try {
    console.log('🔍 Fetching available permissions from backend...\n');
    
    const response = await axios.get(`${API_URL}/secretaries/available-permissions`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const availablePermissions = response.data.grouped_permissions || {};
    
    // Flatten all available permissions into a single array
    const allAvailablePermissions = [];
    Object.keys(availablePermissions).forEach(category => {
      Object.keys(availablePermissions[category]).forEach(permission => {
        allAvailablePermissions.push(permission);
      });
    });

    console.log('✅ Available Permissions in Backend:');
    console.log(JSON.stringify(allAvailablePermissions, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('📋 Permissions you\'re trying to send:');
    console.log(JSON.stringify(attemptedPermissions, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Check which permissions are invalid
    const invalidPermissions = [];
    const validPermissions = [];

    attemptedPermissions.forEach((permission, index) => {
      if (allAvailablePermissions.includes(permission)) {
        validPermissions.push(permission);
      } else {
        invalidPermissions.push({ index, permission });
      }
    });

    if (invalidPermissions.length > 0) {
      console.log('❌ INVALID Permissions (not found in backend):');
      invalidPermissions.forEach(({ index, permission }) => {
        console.log(`   Index ${index}: "${permission}"`);
      });
      console.log('\n');
    }

    if (validPermissions.length > 0) {
      console.log('✅ VALID Permissions:');
      validPermissions.forEach(permission => {
        console.log(`   ✓ ${permission}`);
      });
      console.log('\n');
    }

    // Suggest similar permissions for invalid ones
    if (invalidPermissions.length > 0) {
      console.log('💡 Suggested Alternatives:');
      invalidPermissions.forEach(({ permission }) => {
        const keyword = permission.split('-').pop(); // Get last word
        const suggestions = allAvailablePermissions.filter(p => p.includes(keyword));
        if (suggestions.length > 0) {
          console.log(`   "${permission}" → Try: ${suggestions.join(', ')}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkPermissions();
