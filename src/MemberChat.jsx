import { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyg3Za2miF_LjtNmlGOL9BEU3ueamuxFk",
  authDomain: "member-chat-app-38324.firebaseapp.com",
  projectId: "member-chat-app-38324",
  storageBucket: "member-chat-app-38324.firebasestorage.app",
  messagingSenderId: "1017693624714",
  appId: "1:1017693624714:web:b901c65f7e5adc25d9d073"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function MemberChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessages();
    };
  }, []);

  const handleLogin = () => {
    signInWithPopup(auth, provider).catch((error) => {
      console.error('Login Error:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('ログインに失敗しました。ブラウザのポップアップを許可してください。');
      } else if (error.code === 'auth/api-key-not-valid') {
        alert('APIキーが無効です。Firebaseの設定を確認してください。');
      } else if (error.code === 'auth/configuration-not-found') {
        alert('FirebaseのGoogleログイン設定を確認してください。');
      } else {
        alert('ログインに失敗しました。再試行してください。');
      }
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'messages'), {
      text: message,
      sender: user.displayName,
      timestamp: serverTimestamp()
    });
    setMessage('');
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      {!user ? (
        <button onClick={handleLogin} className="p-2 bg-blue-500 text-white rounded">
          Googleでログイン
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="font-bold">ようこそ、{user.displayName}さん！</p>
            <button onClick={() => signOut(auth)} className="p-2 bg-gray-300 rounded">
              ログアウト
            </button>
          </div>

          <div className="h-72 overflow-y-auto border rounded p-4 mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <strong>{msg.sender}: </strong>{msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex">
            <input
              className="flex-grow border p-2 rounded-l"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを入力"
              required
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-r">
              送信
            </button>
          </form>
        </>
      )}
    </div>
  );
}
