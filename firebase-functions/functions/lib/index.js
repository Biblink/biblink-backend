"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const adminAccount = require('../admin_key.json');
admin.initializeApp({
    credential: admin.credential.cert(adminAccount),
    databaseURL: 'https://biblya-ed2ec.firebaseio.com/'
});
const db = admin.firestore();
exports.updateLeaderName = functions.firestore.document('users/{userId}').onUpdate((event) => {
    const updatedValue = event.data.data();
    const name = updatedValue.name;
    const userId = event.params.userId;
    const userStudies = db.collection('users')
        .doc(userId)
        .collection('studies')
        .where('role', '==', 'leader')
        .get()
        .then(snapshot => {
        let studyIds = [];
        snapshot.forEach(doc => {
            console.log(doc.id);
            studyIds.push(doc.id);
        });
        return studyIds;
    })
        .catch(err => {
        console.log(err);
        return undefined;
    });
    return userStudies.then(studyIds => {
        if (studyIds == undefined)
            return 'person is not a leader in any studies';
        else {
            const studiesRef = db.collection('studies');
            studyIds.forEach(ID => {
                const metadata = studiesRef.doc(ID).get().then(snapshot => {
                    let studyMeta = snapshot.data()['metadata'];
                    studyMeta['leader'] = name;
                    const updataMetaData = studiesRef.doc(ID).update({ metadata: studyMeta });
                });
            });
            return `updated studies with leader: ${name}`;
        }
    });
});
//# sourceMappingURL=index.js.map