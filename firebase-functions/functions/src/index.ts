import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Fuzzy from 'fuzzyset.js';
import * as express from 'express';
import * as fetch from 'node-fetch';
import * as url from 'url';
const app = express();
const databaseUrl = 'biblya-ed2ec.firebaseio.com/';
const appUrl = 'https://biblya-ed2ec.firebaseapp.com';
//admin account creation so the function can modify the database
const adminAccount = require('../admin_key.json');

admin.initializeApp({
    credential: admin.credential.cert(adminAccount),
    databaseURL: `https://${ appUrl }`
});
//opens the database with the admin account
const db = admin.firestore()

const linkRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g; // current regex taken from user Daveo on stack overflow
// old regex => /(www.|https:|http:)?([\S]+)([.]{1})([\w]{1,4})([^ ,.;\n])+/g

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.substr(1);
}
//this function updates the name of study leaders
exports.updateLeaderName = functions.firestore.document('users/{userId}').onUpdate((change, context) => {
    //grabs updated name value
    const updatedValue = change.after.data();
    const name = updatedValue.name;
    const userId = context.params.userId;
    //finds which studies the user is a leader in
    const userStudies = db.collection('users')
        .doc(userId)
        .collection('studies')
        .where('role', '==', 'leader')
        .get()
        .then(snapshot => {
            const studyIds = [];
            snapshot.forEach(doc => {
                studyIds.push(doc.id)
            });
            return studyIds //returns the Ids for those studies
        })
        .catch(err => {
            console.log(err)
            return undefined;
        });
    //if the person is not a leader in any studies, it returns an informative message in the block below
    return userStudies.then(studyIds => {
        if (studyIds === undefined)
            return 'person is not a leader in any studies';
        else {
            const studiesRef = db.collection('studies') //this block iterates through every study where the user is a leader, and changes the leader property to the new name
            studyIds.forEach(ID => {
                const metadata = studiesRef.doc(ID).get().then(snapshot => {
                    const studyMeta = snapshot.data()[ 'metadata' ]
                    studyMeta[ 'leader' ] = name;
                    const updataMetaData = studiesRef.doc(ID).update({ metadata: studyMeta })
                });
            });
            return `updated studies with leader: ${ name }`;
        }
    });
});

exports.updateUserRole = functions.firestore.document('studies/{studyId}/members/{memberId}').onUpdate((change, context) => {
    const userId = context.params.memberId;
    const studyId = context.params.studyId;
    const newRole = change.after.data().role;
    const userStudy = db.collection('users').doc(`${ userId }`).collection('studies').doc(`${ studyId }`);
    return userStudy.update({ role: newRole }).then(() => {
        console.log(`updated user ${ userId } to role ${ newRole } in study ${ studyId }`);
    });
});

const httpRGX = /(https:|http:)+(\/\/)+/g; //defines regular expression for finding links that already have http protocol on them
function anchorify(match: string) {
    const httpTest = httpRGX.test(match)
    if (match.indexOf('</a>') !== -1) { //If the link is already in an anchor, return it as is
        return match;
    }
    if (httpTest === true) { //if the link has http on it already, make the anchor
        const anchor = `<a class="more-link" target="_blank" href="${ match }">${ match }</a>`;
        return anchor;
    }
    else { //if not, add the https:// and then make an anchor
        const updateMatch = 'https://'.concat(match);
        const anchor = `<a class="more-link" target="_blank" href="${ updateMatch }">${ match }</a>`;
        return anchor;
    }
}

const bookList = [ 'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
    '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', ' Revelation' ];

function spanify(match: string) { //This function creates a span that encapsulates the verse references
    const rawRef = match.match(/(\d+:+.*)(\d){1}/g);
    const stringRef = rawRef.join("").trim();
    let bookCont = "";
    let refCont = "";
    if (stringRef.endsWith(",")) {
        const slicedRef = stringRef.slice(0, -1);
        const squishedRef = slicedRef.replace(' ', '')
        const rawBook = match.match(/((\w)*[^:,;.'"\d])/g)
        const stringBook = rawBook.join("").trim();
        //const newMatch = stringBook.concat(" " + squishedRef)
        bookCont = stringBook;
        refCont = squishedRef;
    }
    else {
        const squishedRef = stringRef.replace(' ', '');
        const rawBook = match.match(/((\w)*[^:,;.'"\d])/g);
        const stringBook = rawBook.join("").trim();
        //const newMatch = stringBook.concat(" " + squishedRef)
        bookCont = stringBook;
        refCont = squishedRef;
    }

    const fuzzySet = Fuzzy(bookList, true, 4, 4);
    const fuzzyMatchs = fuzzySet.get(bookCont, .30);
    const topMatch = fuzzyMatchs[ 0 ];
    const reference = refCont//matchCont.trim().split(' ')[ 1 ].trim();
    const bookName = topMatch[ 1 ];
    const span = `<span class="verse-link" data-verse="${ bookName.trim() } ${ reference }">${ bookName.trim() } ${ reference }</span>`; //uses the number bit and the book bit to make an html element
    return span;
}

exports.annotationRegex = functions.firestore.document('studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}').onWrite((change, context) => {
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let annotationText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) { //stops an infinite loop
        return null;
    }
    annotationText = annotationText.replace(linkRegex, anchorify) //adds anchors
    const foundLinks = annotationText.match(/<a[^>]*>([^<]+)<\/a>/g);
    const foundVerses = annotationText.match(/(<span\s.+>)(.)*(<\/span>)/g);

    return change.after.ref.update({ htmlText: annotationText, lastUpdated: now, links: foundLinks });
});




exports.annotationReply = functions.firestore.document('studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}/replies/{replyId}').onWrite((change, context) => {
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let replyText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return null;
    }
    replyText = replyText.replace(linkRegex, anchorify)
    return change.after.ref.update({ htmlText: replyText, lastUpdated: now });
});

exports.annotationSubreply = functions.firestore.document('studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}/replies/{replyId}/subreplies/{subreplyId}').onWrite((change, context) => { //same function but for subreplies
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let subreplyText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return null;
    }
    subreplyText = subreplyText.replace(linkRegex, anchorify)
    return change.after.ref.update({ htmlText: subreplyText, lastUpdated: now });
});

exports.postRegex = functions.firestore.document('studies/{studyId}/posts/{postId}').onWrite((change, context) => { //this firebase function formats posts with spanify and httpRGX
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let annotationText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) { //stops an infinite loop
        return null;
    }
    annotationText = annotationText.replace(linkRegex, anchorify) //adds anchors
    annotationText = annotationText.replace(/(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+(\d)+(:)+([\d,-\s;]*)(\d){1}/g, spanify) //adds spans
    const foundLinks = annotationText.match(/<a[^>]*>([^<]+)<\/a>/g);
    const foundVerses = annotationText.match(/(<span\s.+>)(.)*(<\/span>)/g);
    return change.after.ref.update({ htmlText: annotationText, lastUpdated: now, links: foundLinks, verses: foundVerses });
});

exports.replyRegex = functions.firestore.document('studies/{studyId}/posts/{postId}/replies/{replyId}').onWrite((change, context) => { //this function does the exact same thing but with replies
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let replyText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return null;
    }
    replyText = replyText.replace(linkRegex, anchorify)
    replyText = replyText.replace(/(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g, spanify)
    return change.after.ref.update({ htmlText: replyText, lastUpdated: now });
});

exports.subreplyRegex = functions.firestore.document('studies/{studyId}/posts/{postId}/replies/{replyId}/subreplies/{subreplyId}').onWrite((change, context) => { //same function but for subreplies
    if (!change.after.exists) {
        return null;
    }
    const data = change.after.data();
    let subreplyText: string = data[ 'text' ];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return null;
    }
    subreplyText = subreplyText.replace(linkRegex, anchorify)
    subreplyText = subreplyText.replace(/(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g, spanify)
    return change.after.ref.update({ htmlText: subreplyText, lastUpdated: now });
});

exports.notifyUserOfPost = functions.firestore.document('studies/{studyId}/posts/{postId}').onCreate(async (change, context) => {
    const postData = change.data();
    const studyID = context.params.studyId;
    const creatorID = postData[ 'creatorID' ];
    const date = new Date();
    const payload = {
        notification: {
            title: '',
            body: '',
            icon: '',
            studyID: studyID,
            timestamp: Date.now().toString()
        }
    }
    const userData = db.collection('users').doc(creatorID).get()
        .then(snapshot => snapshot.data())
        .then((user) => {
            const firstName = user[ 'firstName' ];
            const imageUrl = user[ 'data' ][ 'profileImage' ];

            payload.notification.title = `New ${ capitalize(postData[ 'type' ]) }`;
            payload.notification.body = `${ firstName } just posted a new ${ postData[ 'type' ] }`;
            payload.notification.icon = imageUrl;
            console.log('Created payload:', payload);
        });
    const memberIDsPromise = userData.then(() => {
        return db.doc(`studies/${ studyID }`).collection('members').get().then((members) => {
            let memberIDs = [];
            members.forEach((member) => {
                memberIDs = [ ...memberIDs, member.id ];
            });
            return memberIDs;
        });
    });

    return memberIDsPromise.then((ids) => {
        const promises = []
        ids.forEach((id: string) => {
            if (id !== creatorID) {
                db.doc(`users/${ id }`).get()
                    .then(snapshot => snapshot.data())
                    .then(user => {
                        let tokens = []
                        const addNotif = db.doc(`users/${ id }`).collection('notifications').add(payload);
                        if (user.fcmTokens !== undefined) {
                            tokens = user.fcmTokens ? Object.keys(user.fcmTokens) : [];
                            if (!tokens.length) {
                                throw new Error('User does not have any tokens!');
                            }
                        } else {
                            throw new Error('User does not have any tokens!');
                        }
                        return admin.messaging().sendToDevice(tokens, payload);
                    })
                    .catch(err => console.log(err))
            }
        });
        return 'finished sending notifications';
    });
});


const ROUTES = [
    '/',
    '/search',
    '/get-started',
    '/sign-in',
    '/about',
    '/legal/privacy-policy',
    '/legal/terms-of-use',
    '/organization/contact',
    '/organization/updates-and-releases'
];

app.get('*', (req, res) => {
    if (ROUTES.indexOf(req.url) === -1) {
        fetch(`${ appUrl }/?path=${ req.url }`)
            .then(response => response.text())
            .then(body => {
                res.send(body.toString());
            });
    } else {
        fetch(`${ appUrl }${ req.url }`)
            .then(response => response.text())
            .then(body => {
                res.send(body.toString());
            });
    }
});

exports.app = functions.https.onRequest(app);