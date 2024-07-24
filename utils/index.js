const COMMUNICATION_FOLDER_ID = process.env.COMMUNICATION_FOLDER_ID;
const FINANCE_FOLDER_ID = process.env.FINANCE_FOLDER_ID;
const EVENT_FOLDER_ID = process.env.EVENT_FOLDER_ID

async function findThreadChannelName(thread) {
    try {    
        const parentChannel = thread.parent;
        if (parentChannel) return parentChannel.name;
    } catch (error) {
        console.error('Error fetching thread or channel:', error);
    }
};

module.exports = {
    COMMUNICATION_FOLDER_ID,
    FINANCE_FOLDER_ID,
    EVENT_FOLDER_ID,
    findThreadChannelName
};
