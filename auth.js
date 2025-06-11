// 認証ユーティリティ
import { config } from './config.js';

class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.token = '';
    }


    // GitHubトークンの検証
    async validateGitHubToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(config.messages.errors.invalidToken);
            }

            const userData = await response.json();
            return userData.login === config.github.owner;
        } catch (error) {
            console.error('GitHubトークン検証エラー:', error);
            throw new Error(config.messages.errors.invalidToken);
        }
    }

    // 管理者認証
    async login(email, password) {
        try {
            // 本番環境ではFirebase Authを使用
            // 開発環境では簡易的な認証を使用
            if (process.env.NODE_ENV === 'development') {
                if (email === 'admin@example.com' && password === 'admin123') {
                    this.isAuthenticated = true;
                    config.admin.isAuthenticated = true;
                    return true;
                }
                throw new Error(config.messages.errors.authentication);
            }

            // Firebase Authを使用した認証
            // const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            // this.isAuthenticated = true;
            // config.admin.isAuthenticated = true;
            // return true;

        } catch (error) {
            console.error('認証エラー:', error);
            throw new Error(config.messages.errors.authentication);
        }
    }

    // ログアウト
    logout() {
        this.isAuthenticated = false;
        this.token = '';
        config.admin.isAuthenticated = false;
        localStorage.removeItem('github_token');
        localStorage.removeItem('admin_authenticated');
    }

    // 認証状態の確認
    checkAuth() {
        return this.isAuthenticated && config.admin.isAuthenticated;
    }

    // GitHubトークンの設定
    async setGitHubToken(token) {
        try {
            const isValid = await this.validateGitHubToken(token);
            if (isValid) {
                this.token = token;
                config.github.token = token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('GitHubトークン設定エラー:', error);
            return false;
        }
    }
}

// シングルトンインスタンスの作成
const auth = new Auth();

// 認証のエクスポート
export { auth }; 