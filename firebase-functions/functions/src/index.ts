import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Fuzzy from 'fuzzyset.js';
import * as express from 'express';
import * as fetch from 'node-fetch';
import * as url from 'url';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';
import * as cors from 'cors';
const app = express();
const databaseUrl = 'biblya-ed2ec.firebaseio.com/';
const appUrl = 'biblink.io';
const renderUrl = 'https://render-tron.appspot.com/render';

// Deploy your own instance of Rendertron for production
// const renderUrl = 'your-rendertron-url';
//admin account creation so the function can modify the database
const adminAccount = require('../admin_key.json');

admin.initializeApp({
  credential: admin.credential.cert(adminAccount),
  databaseURL: databaseUrl
});
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);
sgClient.setApiKey(SENDGRID_API_KEY);

//opens the database with the admin account
const db = admin.firestore();

const linkRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g; // current regex taken from user Daveo on stack overflow
// old regex => /(www.|https:|http:)?([\S]+)([.]{1})([\w]{1,4})([^ ,.;\n])+/g

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}
//this function updates the name of study leaders
exports.updateLeaderName = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    //grabs updated name value
    const updatedValue = change.after.data();
    const name = updatedValue.name;
    const userId = context.params.userId;
    //finds which studies the user is a leader in
    const userStudies = db
      .collection('users')
      .doc(userId)
      .collection('studies')
      .where('role', '==', 'leader')
      .get()
      .then(snapshot => {
        const studyIds = [];
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
      if (studyIds === undefined)
        return 'person is not a leader in any studies';
      else {
        const studiesRef = db.collection('studies'); //this block iterates through every study where the user is a leader, and changes the leader property to the new name
        studyIds.forEach(ID => {
          const metadata = studiesRef
            .doc(ID)
            .get()
            .then(snapshot => {
              const studyMeta = snapshot.data()['metadata'];
              studyMeta['leader'] = name;
              const updataMetaData = studiesRef
                .doc(ID)
                .update({ metadata: studyMeta });
            });
        });
        return `updated studies with leader: ${name}`;
      }
    });
  });

exports.addEmails = functions.firestore
  .document('users/{userID}')
  .onWrite((change, context) => {
    const users = db
      .collection('users')
      .get()
      .then(snapshot => {
        const data = snapshot.docs;
        const emails = [];
        data.forEach(value => {
          const user = {
            email: '',
            first_name: '',
            last_name: ''
          };
          const userData = value.data();
          user.email = userData['email'];
          user.first_name = userData['firstName'];
          user.last_name = userData['lastName'];
          emails.push(user);
        });
        const request = {
          method: 'POST',
          url: '/v3/contactdb/recipients',
          body: emails
        };
        return sgClient.request(request);
      });
  });
exports.updateUserRole = functions.firestore
  .document('studies/{studyId}/members/{memberId}')
  .onUpdate((change, context) => {
    const userId = context.params.memberId;
    const studyId = context.params.studyId;
    const newRole = change.after.data().role;
    const userStudy = db
      .collection('users')
      .doc(`${userId}`)
      .collection('studies')
      .doc(`${studyId}`);
    return userStudy.update({ role: newRole }).then(() => {
      console.log(
        `updated user ${userId} to role ${newRole} in study ${studyId}`
      );
    });
  });

const httpRGX = /(https:|http:)+(\/\/)+/g; //defines regular expression for finding links that already have http protocol on them
function anchorify(match: string) {
  const httpTest = httpRGX.test(match);
  if (match.indexOf('</a>') !== -1) {
    //If the link is already in an anchor, return it as is
    return match;
  }
  if (httpTest === true) {
    //if the link has http on it already, make the anchor
    const anchor = `<a class="more-link" target="_blank" href="${match}">${match}</a>`;
    return anchor;
  } else {
    //if not, add the https:// and then make an anchor
    let updateMatch: string;
    if (match.indexOf('http://') !== -1 || match.indexOf('https://') !== -1) {
      updateMatch = match;
    } else {
      updateMatch = 'https://'.concat(match);
    }

    const anchor = `<a class="more-link" target="_blank" href="${updateMatch}">${match}</a>`;
    return anchor;
  }
}

const bookList = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  ' Revelation'
];

function spanify(match: string) {
  //This function creates a span that encapsulates the verse references
  const rawRef = match.match(/(\d+:+.*)(\d){1}/g);
  const stringRef = rawRef.join('').trim();
  let bookCont = '';
  let refCont = '';
  if (stringRef.endsWith(',')) {
    const slicedRef = stringRef.slice(0, -1);
    const squishedRef = slicedRef.replace(' ', '');
    const rawBook = match.match(/((\w)*[^:,;.'"\d])/g);
    const stringBook = rawBook.join('').trim();
    //const newMatch = stringBook.concat(" " + squishedRef)
    bookCont = stringBook;
    refCont = squishedRef;
  } else {
    const squishedRef = stringRef.replace(' ', '');
    const rawBook = match.match(/((\w)*[^:,;.'"\d])/g);
    const stringBook = rawBook.join('').trim();
    //const newMatch = stringBook.concat(" " + squishedRef)
    bookCont = stringBook;
    refCont = squishedRef;
  }

  const fuzzySet = Fuzzy(bookList, true, 4, 4);
  const fuzzyMatchs = fuzzySet.get(bookCont, 0.3);
  const topMatch = fuzzyMatchs[0];
  const reference = refCont; //matchCont.trim().split(' ')[ 1 ].trim();
  const bookName = topMatch[1];
  const span = `<span class="verse-link" data-verse="${bookName.trim()} ${reference}">${bookName.trim()} ${reference}</span>`; //uses the number bit and the book bit to make an html element
  return span;
}

exports.annotationRegex = functions.firestore
  .document(
    'studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}'
  )
  .onWrite((change, context) => {
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let annotationText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      //stops an infinite loop
      return null;
    }
    annotationText = annotationText.replace(linkRegex, anchorify); //adds anchors
    const foundLinks = annotationText.match(/<a[^>]*>([^<]+)<\/a>/g);
    const foundVerses = annotationText.match(/(<span\s.+>)(.)*(<\/span>)/g);

    return change.after.ref.update({
      htmlText: annotationText,
      lastUpdated: now,
      links: foundLinks
    });
  });

exports.annotationReply = functions.firestore
  .document(
    'studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}/replies/{replyId}'
  )
  .onWrite((change, context) => {
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let replyText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      return null;
    }
    replyText = replyText.replace(linkRegex, anchorify);
    return change.after.ref.update({ htmlText: replyText, lastUpdated: now });
  });

exports.annotationSubreply = functions.firestore
  .document(
    'studies/{studyId}/annotations/{annotationName}/{annotationType}/{annotationId}/replies/{replyId}/subreplies/{subreplyId}'
  )
  .onWrite((change, context) => {
    //same function but for subreplies
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let subreplyText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      return null;
    }
    subreplyText = subreplyText.replace(linkRegex, anchorify);
    return change.after.ref.update({
      htmlText: subreplyText,
      lastUpdated: now
    });
  });

exports.postRegex = functions.firestore
  .document('studies/{studyId}/posts/{postId}')
  .onWrite((change, context) => {
    //this firebase function formats posts with spanify and httpRGX
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let annotationText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      //stops an infinite loop
      return null;
    }
    annotationText = annotationText.replace(linkRegex, anchorify); //adds anchors
    annotationText = annotationText.replace(
      /(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+(\d)+(:)+([\d,-\s;]*)(\d){1}/g,
      spanify
    ); //adds spans
    const foundLinks = annotationText.match(/<a[^>]*>([^<]+)<\/a>/g);
    const foundVerses = annotationText.match(/(<span\s.+>)(.)*(<\/span>)/g);
    return change.after.ref.update({
      htmlText: annotationText,
      lastUpdated: now,
      links: foundLinks,
      verses: foundVerses
    });
  });

exports.replyRegex = functions.firestore
  .document('studies/{studyId}/posts/{postId}/replies/{replyId}')
  .onWrite((change, context) => {
    //this function does the exact same thing but with replies
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let replyText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      return null;
    }
    replyText = replyText.replace(linkRegex, anchorify);
    replyText = replyText.replace(
      /(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g,
      spanify
    );
    return change.after.ref.update({ htmlText: replyText, lastUpdated: now });
  });

exports.subreplyRegex = functions.firestore
  .document(
    'studies/{studyId}/posts/{postId}/replies/{replyId}/subreplies/{subreplyId}'
  )
  .onWrite((change, context) => {
    //same function but for subreplies
    if (!change.after.exists) {
      return null;
    }
    const data = change.after.data();
    let subreplyText: string = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - 2000) {
      return null;
    }
    subreplyText = subreplyText.replace(linkRegex, anchorify);
    subreplyText = subreplyText.replace(
      /(Song)?\s?(of)?\s?(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g,
      spanify
    );
    return change.after.ref.update({
      htmlText: subreplyText,
      lastUpdated: now
    });
  });

function sendNotificationToMembers(
  payload,
  creatorID: string,
  studyID: string
) {
  const memberIDsPromise = db
    .doc(`studies/${studyID}`)
    .collection('members')
    .get()
    .then(members => {
      let memberIDs = [];
      members.forEach(member => {
        memberIDs = [...memberIDs, member.id];
      });
      return memberIDs;
    });

  return memberIDsPromise.then((ids: any[]) => {
    const promises = [];
    ids.forEach((id: string) => {
      if (id !== creatorID) {
        db.doc(`users/${id}`)
          .get()
          .then(snapshot => snapshot.data())
          .then(user => {
            let tokens = [];
            const addNotif = db
              .doc(`users/${id}`)
              .collection('notifications')
              .add(payload);
            if (user.fcmTokens !== undefined) {
              tokens = user.fcmTokens ? Object.keys(user.fcmTokens) : [];
            }
            return admin.messaging().sendToDevice(tokens, payload);
          })
          .catch(err => console.log(err));
      }
    });
    return 'finished sending notifications';
  });
}

exports.notifyUserOfPost = functions.firestore
  .document('studies/{studyId}/posts/{postId}')
  .onCreate(async (change, context) => {
    const postData = change.data();
    const studyID = context.params.studyId;
    const creatorID = postData['creatorID'];
    const date = Date.now().toString();
    const payload = {
      notification: {
        title: '',
        body: '',
        icon: '',
        studyID: studyID,
        timestamp: date
      }
    };
    const userData = db
      .collection('users')
      .doc(creatorID)
      .get()
      .then(snapshot => snapshot.data())
      .then(user => {
        const firstName = user['firstName'];
        let imageUrl = user['data']['profileImage'];

        payload.notification.title = `New ${capitalize(postData['type'])}`;
        payload.notification.body = `${firstName} just posted a new ${
          postData['type']
        }`;
        if (imageUrl === null) {
          imageUrl = 'https://i.postimg.cc/k50TqRF7/default-photo.png';
        }
        payload.notification.icon = imageUrl;
        console.log('Created payload:', payload);
      });

    return userData.then(() => {
      return sendNotificationToMembers(payload, creatorID, studyID);
    });
  });
exports.notifyUserOfTopicCreation = functions.firestore
  .document('studies/{studyId}/topics/{topicId}')
  .onCreate(async (change, context) => {
    const postData = change.data();
    const studyID = context.params.studyId;
    const creatorID = postData['creatorID'];
    const date = Date.now().toString();
    const payload = {
      notification: {
        title: '',
        body: '',
        icon: '',
        studyID: studyID,
        timestamp: date
      }
    };

    const userData = db
      .collection('users')
      .doc(creatorID)
      .get()
      .then(snapshot => snapshot.data())
      .then(user => {
        const firstName = user['firstName'];
        let imageUrl = user['data']['profileImage'];
        if (imageUrl === null) {
          imageUrl = 'https://i.postimg.cc/k50TqRF7/default-photo.png';
        }
        payload.notification.title = `New Topic`;
        payload.notification.body = `${firstName} just created a new topic called ${
          postData.title
        }`;
        payload.notification.icon = imageUrl;
        console.log('Created payload:', payload);
      });
    return userData.then(() => {
      return sendNotificationToMembers(payload, creatorID, studyID);
    });
  });
exports.notifyUserOfDiscussion = functions.firestore
  .document('studies/{studyId}/topics/{topicId}/discussions/{discussionId}')
  .onCreate(async (change, context) => {
    const postData = change.data();
    const studyID = context.params.studyId;
    const topicID = context.params.topicId;
    const creatorID = postData['creatorID'];
    const date = Date.now().toString();
    const payload = {
      notification: {
        title: '',
        body: '',
        icon: '',
        studyID: studyID,
        timestamp: date
      }
    };
    const userData = db
      .collection('users')
      .doc(creatorID)
      .get()
      .then(snapshot => snapshot.data())
      .then(user => {
        const firstName = user['firstName'];
        let imageUrl = user['data']['profileImage'];
        if (imageUrl === null) {
          imageUrl = 'https://i.postimg.cc/k50TqRF7/default-photo.png';
        }
        const topicData = db
          .collection('studies')
          .doc(studyID)
          .collection('topics')
          .doc(topicID)
          .get()
          .then(snapshot => snapshot.data())
          .then(topic => {
            payload.notification.title = `New Discussion`;
            payload.notification.body = `${firstName} just posted a new discussion called ${
              postData.title
            } in ${topic.title}`;
            payload.notification.icon = imageUrl;
            console.log('Created payload:', payload);
          });
        return topicData;
      });
    return userData.then(() => {
      return sendNotificationToMembers(payload, creatorID, studyID);
    });
  });

exports.memberAddition = functions.firestore
  .document('studies/{studyId}/members/{memberId}')
  .onCreate(async (change, context) => {
    const memberID = context.params.memberId;
    const studyID = context.params.studyId;
    const date = Date.now().toString();
    const payload = {
      notification: {
        title: '',
        body: '',
        icon: '',
        studyID: studyID,
        timestamp: date
      }
    };
    const userData = db
      .collection('users')
      .doc(memberID)
      .get()
      .then(snapshot => snapshot.data())
      .then(user => {
        const firstName = user['firstName'];
        let imageUrl = user['data']['profileImage'];
        if (imageUrl === null) {
          imageUrl = 'https://i.postimg.cc/k50TqRF7/default-photo.png';
        }
        const studyData = db
          .collection('studies')
          .doc(studyID)
          .get()
          .then(snapshot => snapshot.data())
          .then(study => {
            payload.notification.title = `New Member`;
            payload.notification.body = `${firstName} just joined ${
              study.name
            }`;
            payload.notification.icon = imageUrl;
            console.log('Created payload:', payload);
          });
        return studyData;
      });
    return userData.then(() => {
      return sendNotificationToMembers(payload, memberID, studyID);
    });
  });

exports.countDiscussionNumber = functions.firestore
  .document('studies/{studyId}/topics/{topicId}/discussions/{documentId}')
  .onCreate((change, context) => {
    const topicId = context.params.topicId;
    const ref = db.doc(`/studies/${context.params.studyId}/topics/${topicId}`);
    return ref
      .get()
      .then(snapshot => snapshot.data())
      .then(topic => {
        topic['discussionNumber'] += 1;
        return topic;
      })
      .then(topic => {
        return ref.update(topic);
      });
  });

// Generates the URL
function generateUrl(request) {
  return url.format({
    protocol: request.protocol,
    host: appUrl,
    pathname: request.originalUrl
  });
}

// List of bots to target, add more if you'd like
function detectBot(userAgent) {
  const bots = [
    // search engine crawler bots
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    // social media link bots
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'embedly',
    'baiduspider',
    'pinterest',
    'slackbot',
    'vkshare',
    'facebot',
    'outbrain',
    'w3c_validator'
  ];

  // Return true if the user-agent header matches a bot namespace
  const agent = userAgent.toLowerCase();

  for (const bot of bots) {
    if (agent.indexOf(bot) > -1) {
      console.log('bot detected', bot, agent);
      return true;
    }
  }

  console.log('no bots found');
  return false;
}

app.get('*', (req, res) => {
  const isBot = detectBot(req.headers['user-agent']);

  if (isBot) {
    const botUrl = generateUrl(req);
    // If Bot, fetch url via rendertron

    fetch(`${renderUrl}/${botUrl}`)
      .then(response => response.text())
      .then(body => {
        // Set the Vary header to cache the user agent, based on code from:
        // https://github.com/justinribeiro/pwa-firebase-functions-botrender
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.set('Vary', 'User-Agent');

        res.send(body.toString());
      });
  } else {
    fetch(`https://${appUrl}`)
      .then(response => response.text())
      .then(body => {
        res.send(body.toString());
      });
  }
});

exports.app = functions.https.onRequest(app);

exports.sendWelcomeEmail = functions.https.onRequest((req, res) => {
  cors({ origin: true })(req, res, () => {
    const email = req.body.email;
    const name = req.body.name;
    const msg = {
      to: email,
      from: 'teambiblink@gmail.com',
      subject: 'Welcome to Biblink',
      templateId: 'd-360af3ce0d5e4159946db509de657734',
      substitutionWrappers: ['{{', '}}'],
      substitutions: {
        name: name
      }
    };
    return sgMail
      .send(msg)
      .then(() => res.status(200).send('email sent!'))
      .catch(err => res.status(400).send(err));
  });
});
exports.sendJoinEmail = functions.https.onRequest((req, res) => {
  cors({ origin: true })(req, res, () => {
    const studyID = req.body.studyID;
    const email = req.body.email;
    const linkBeginning = `https://${appUrl}/join?info=`;
    const msg = {
      to: email,
      from: 'teambiblink@gmail.com',
      subject: '',
      templateId: 'd-e2f16f1ce6df4284adf62fbf70f8423e',
      dynamic_template_data: {
        studyName: '',
        studyDescription: '',
        studyImage: '',
        joinLink: ''
      }
    };
    const promise = db
      .collection('studies')
      .doc(studyID)
      .get()
      .then(snapshot => snapshot.data())
      .then(data => {
        const description = data['metadata']['description'];
        const profileImage = data['metadata']['profileImage'];
        const name = data['name'];
        const linkEnd = `${data['search_name']};${data['uniqueID']}`;
        msg['dynamic_template_data']['studyName'] = name;
        msg['dynamic_template_data']['studyDescription'] = description;
        msg['dynamic_template_data']['studyImage'] = profileImage;
        msg['dynamic_template_data']['joinLink'] = linkBeginning.concat(
          linkEnd
        );
        return msg;
      });
    return promise.then(message => {
      message['to'] = email;
      console.log(message);
      return sgMail
        .send(message)
        .then(() => res.status(200).send('email sent!'))
        .catch(err => {
          console.log(err);
          res.status(400).send(err);
        });
    });
  });
});
