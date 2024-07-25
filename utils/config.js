const COMMUNICATION_FOLDER_ID = process.env.COMMUNICATION_FOLDER_ID;
const FINANCE_FOLDER_ID = process.env.FINANCE_FOLDER_ID;
const EVENT_FOLDER_ID = process.env.EVENT_FOLDER_ID;
const ALCOHOL_COMMAND_ID = process.env.ALCOHOL_COMMAND_ID;

const roomOptions = {
    galerie: 'Galerie Rolland',
    kiosque_1_lassonde: 'Kiosque 1er Lassonde',
    amphi: 'Amphithéâtre Bernard-Lamarre',
    vitrine: 'Vitrine étudiante (C-200)',
    cafeteria: 'Cafétéria',
    rotonde: 'Rotonde palier supérieur',
    lassonde_six: '6e Lassonde (mur bleu)',
    lassonde_1_etage: 'Hall Lassonde',
    atrium: 'Atrium',
    classroom: 'Salle de classe',
    outside_poly: 'Extérieur de Poly',
};

const roomPlanFileId = {
    galerie: process.env.GALERIE,
    kiosque_1_lassonde: process.env.KIOSQUE_1_LASSONDE,
    amphi: process.env.AMPHI,
    vitrine: process.env.VITRINE,
    cafeteria: process.env.CAFETERIA,
    rotonde: process.env.ROTONDE,
    lassonde_six: process.env.LASSONDE_SIX,
    lassonde_1_etage: process.env.LASSONDE_1_ETAGE,
    atrium: process.env.ATRIUM,
};

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
    ALCOHOL_COMMAND_ID,
    findThreadChannelName,
    roomOptions,
    roomPlanFileId,
};