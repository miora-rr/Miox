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

const roomOptions = {
    galerie: 'Galerie Rolland',
    kiosque_1_lassonde: 'Kiosque 1er Lassonde',
    amphi: 'Amphithéâtre Bernard-Lamarre',
    vitrine: 'Vitrine étudiante (C-200)',
    cafeteria: 'Cafétéria',
    rotonde_top: 'Rotonde palier supérieur',
    rotonde_middle: 'Rotonde palier central',
    rontonde_bottom: 'Rotonde palier inférieur',
    lassonde_six: '6e Lassonde (mur bleu)',
    hall_lassonde: 'Hall Lassonde',
    atrium: 'Atrium',
    classroom: 'Salle de classe',
    outside_poly: 'Extérieur de Poly',
};

const roomPlanFileId = {
    galerie: '1h9VsFYgu75MhF5AgV6W1L9mMcZ-T8MzB',
    kiosque_1_lassonde: 'Kiosque 1er Lassonde',
    amphi: 'Amphithéâtre Bernard-Lamarre',
    vitrine: 'Vitrine étudiante (C-200)',
    cafeteria: '1f5cZoptHxdvEUb_87vxNQvwAG_xA4HvC',
    rotonde_top: 'Rotonde palier supérieur',
    rotonde_middle: 'Rotonde palier central',
    rontonde_bottom: 'Rotonde palier inférieur',
    lassonde_six: '6e Lassonde (mur bleu)',
    hall_lassonde: 'Hall Lassonde',
    atrium: 'Atrium',
    classroom: 'Salle de classe',
    outside_poly: 'Extérieur de Poly',
}

module.exports = {
    COMMUNICATION_FOLDER_ID,
    FINANCE_FOLDER_ID,
    EVENT_FOLDER_ID,
    findThreadChannelName,
    roomOptions,
    roomPlanFileId
};