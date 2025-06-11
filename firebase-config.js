import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, set, get, push, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    databaseURL: "https://alnavi-default-rtdb.asia-southeast1.firebasedatabase.app",
    // 他の設定値は Firebase Console から取得して追加
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// データベースの参照
const submissionsRef = ref(database, 'submissions');
const alcoholsRef = ref(database, 'alcohols');

// 認証状態の監視
export const initAuth = (callback) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

// データの操作関数
export const db = {
    // 管理者認証
    async authenticateAdmin(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Error authenticating admin:', error);
            throw new Error('認証に失敗しました');
        }
    },

    // ログアウト
    async logout() {
        try {
            await signOut(auth);
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            throw new Error('ログアウトに失敗しました');
        }
    },

    // 投稿の追加
    async addSubmission(submission) {
        try {
            const newSubmissionRef = push(submissionsRef);
            await set(newSubmissionRef, {
                ...submission,
                id: newSubmissionRef.key,
                status: 'pending',
                submittedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error adding submission:', error);
            throw new Error('投稿の追加に失敗しました');
        }
    },

    // 保留中の投稿を取得
    async getPendingSubmissions() {
        try {
            const snapshot = await get(submissionsRef);
            if (snapshot.exists()) {
                const submissions = [];
                snapshot.forEach((childSnapshot) => {
                    const submission = childSnapshot.val();
                    if (submission.status === 'pending') {
                        submissions.push(submission);
                    }
                });
                return submissions;
            }
            return [];
        } catch (error) {
            console.error('Error getting submissions:', error);
            throw new Error('投稿の取得に失敗しました');
        }
    },

    // 承認済みのお酒を取得
    async getAlcohols() {
        try {
            const snapshot = await get(alcoholsRef);
            if (snapshot.exists()) {
                const alcohols = [];
                snapshot.forEach((childSnapshot) => {
                    alcohols.push(childSnapshot.val());
                });
                return alcohols;
            }
            return [];
        } catch (error) {
            console.error('Error getting alcohols:', error);
            throw new Error('お酒の情報の取得に失敗しました');
        }
    },

    // 投稿を承認
    async approveSubmission(submissionId, imageUrl) {
        try {
            if (!auth.currentUser) {
                throw new Error('認証が必要です');
            }

            const submissionSnapshot = await get(submissionsRef);
            let submission = null;
            let submissionRef = null;

            submissionSnapshot.forEach((childSnapshot) => {
                if (childSnapshot.key === submissionId) {
                    submission = childSnapshot.val();
                    submissionRef = childSnapshot.ref;
                }
            });

            if (!submission) {
                throw new Error('投稿が見つかりません');
            }

            const newAlcoholRef = push(alcoholsRef);
            await set(newAlcoholRef, {
                ...submission,
                id: newAlcoholRef.key,
                imageUrl: imageUrl || null, // 管理者が設定した画像URL
                approvedAt: new Date().toISOString(),
                approvedBy: auth.currentUser.uid
            });

            await remove(submissionRef);
            return true;
        } catch (error) {
            console.error('Error approving submission:', error);
            throw new Error('投稿の承認に失敗しました');
        }
    },

    // 投稿を却下
    async rejectSubmission(submissionId) {
        try {
            if (!auth.currentUser) {
                throw new Error('認証が必要です');
            }

            const submissionSnapshot = await get(submissionsRef);
            let submissionRef = null;

            submissionSnapshot.forEach((childSnapshot) => {
                if (childSnapshot.key === submissionId) {
                    submissionRef = childSnapshot.ref;
                }
            });

            if (!submissionRef) {
                throw new Error('投稿が見つかりません');
            }

            await remove(submissionRef);
            return true;
        } catch (error) {
            console.error('Error rejecting submission:', error);
            throw new Error('投稿の却下に失敗しました');
        }
    }
}; 