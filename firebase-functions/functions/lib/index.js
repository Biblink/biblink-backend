"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const gcs = require('@google-cloud/storage')({ keyFilename: 'admin_key.json' });
const spawn = require('child-process-promise').spawn;
//admin account creation so the function can modify the database
const adminAccount = require('../admin_key.json');
admin.initializeApp({
    credential: admin.credential.cert(adminAccount),
    databaseURL: 'https://biblya-ed2ec.firebaseio.com/'
});
//opens the database with the admin account
const db = admin.firestore();
//this function updates the name of study leaders
exports.updateLeaderName = functions.firestore.document('users/{userId}').onUpdate((event) => {
    //grabs updated name value
    const updatedValue = event.data.data();
    const name = updatedValue.name;
    const userId = event.params.userId;
    //finds which studies the user is a leader in
    const userStudies = db.collection('users')
        .doc(userId)
        .collection('studies')
        .where('role', '==', 'leader')
        .get()
        .then(snapshot => {
        let studyIds = [];
        snapshot.forEach(doc => {
            studyIds.push(doc.id);
        });
        return studyIds; //returns the Ids for those studies
    })
        .catch(err => {
        console.log(err);
        return undefined;
    });
    //if the person is not a leader in any studies, it returns an informative message in the block below
    return userStudies.then(studyIds => {
        if (studyIds == undefined)
            return 'person is not a leader in any studies';
        else {
            const studiesRef = db.collection('studies'); //this block iterates through every study where the user is a leader, and changes the leader property to the new name
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
/**
 * The code below was copied from : https://github.com/firebase/functions-samples/blob/master/generate-thumbnail/functions/index.js
 * And edited slightly to match our project
 */
// const THUMB_MAX_HEIGHT = 200;
// const THUMB_MAX_WIDTH = 200;
// const THUMB_PREFIX = 'thumb_';
// exports.generateThumbnail = functions.storage.object().onChange((event) => {
//     const filePath = event.data.name;
//     const contentType = event.data.contentType;
//     const fileDir = path.dirname(filePath);
//     const fileName = path.basename(filePath);
//     const info = fileName.split('-')[ 1 ].split('_');
//     const id = info[ 0 ];
//     const isGroup = info[ 1 ] === 'true';
//     const imageType = info[ 2 ];
//     const thumbFilePath = path.normalize(path.join(fileDir, `${ THUMB_PREFIX }${ fileName }`));
//     const tempLocalFile = path.join(os.tmpdir(), filePath);
//     const tempLocalDir = path.dirname(tempLocalFile);
//     const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);
//     if (isGroup && imageType === 'banner') {
//         return null;
//     }
//     if (!contentType.startsWith('image/')) {
//         console.log('This is not an image.');
//         return null;
//     }
//     if (fileName.startsWith(THUMB_PREFIX)) {
//         console.log('Already a Thumbnail.');
//         return null;
//     }
//     if (event.data.resourceState === 'not_exists') {
//         console.log('This is a deletion event.');
//         return null;
//     }
//     const bucket = gcs.bucket(event.data.bucket);
//     const file = bucket.file(filePath);
//     const thumbFile = bucket.file(thumbFilePath);
//     const metadata = { contentType: contentType };
//     return mkdirp(tempLocalDir).then(() => {
//         return file.download({ destination: tempLocalFile });
//     }).then(() => {
//         console.log('The file has been downloaded to', tempLocalFile);
//         return spawn('convert', [ tempLocalFile, '-thumbnail', `${ THUMB_MAX_WIDTH }x${ THUMB_MAX_HEIGHT }>`, tempLocalThumbFile ], { capture: [ 'stdout', 'stderr' ] });
//     }).then(() => {
//         console.log('Thumbnail created at', tempLocalThumbFile);
//         return bucket.upload(tempLocalThumbFile, { destination: thumbFilePath, metadata: metadata });
//     }).then(() => {
//         console.log('Thumbnail uploaded to Storage at', thumbFilePath);
//         fs.unlinkSync(tempLocalFile);
//         fs.unlinkSync(tempLocalThumbFile);
//         const config = {
//             action: 'read',
//             expires: '03-01-2500',
//         };
//         return Promise.all([
//             thumbFile.getSignedUrl(config),
//             file.getSignedUrl(config),
//         ]);
//     }).then((results) => {
//         console.log('Got Signed URLs.');
//         const thumbResult = results[ 0 ];
//         const originalResult = results[ 1 ];
//         const thumbFileUrl = thumbResult[ 0 ];
//         const fileUrl = originalResult[ 0 ];
//         if (isGroup) {
//             return db.collection('studies').doc(id).get().then((res) => {
//                 const data = res.data()[ 'metadata' ]
//                 data[ 'profileImage' ] = thumbFileUrl;
//                 return db.collection('studies').doc(id).update({ 'metadata': data });
//             });
//         } else {
//             console.log(id);
//             return db.collection('users').doc(id).get().then(res => {
//                 const data = res.data()[ 'data' ]
//                 data[ 'profileImage' ] = thumbFileUrl;
//                 return db.collection('users').doc(id).update({ 'data': data });
//             });
//         }
//     }).then(() => console.log('Thumbnail URLs saved to database.'));
// });
//# sourceMappingURL=index.js.map