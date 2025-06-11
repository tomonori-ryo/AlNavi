// データ操作ユーティリティ
import { config } from './config.js';
import { auth } from './auth.js';

class DataManager {
    constructor() {
        this.githubApiUrl = 'https://api.github.com';
    }

    // GitHub APIのヘッダーを取得
    getHeaders() {
        return {
            'Authorization': `token ${auth.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }

    // ファイルの内容を取得
    async getFileContent(path) {
        try {
            const response = await fetch(
                `${this.githubApiUrl}/repos/${config.github.owner}/${config.github.repo}/contents/${path}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(config.messages.errors.fetchSubmissions);
            }

            const data = await response.json();
            return JSON.parse(atob(data.content));
        } catch (error) {
            console.error('ファイル取得エラー:', error);
            throw error;
        }
    }

    // ファイルの内容を更新
    async updateFileContent(path, content, message) {
        try {
            // 現在のファイルのSHAを取得
            const currentFile = await fetch(
                `${this.githubApiUrl}/repos/${config.github.owner}/${config.github.repo}/contents/${path}`,
                { headers: this.getHeaders() }
            ).then(res => res.json());

            // ファイルを更新
            const response = await fetch(
                `${this.githubApiUrl}/repos/${config.github.owner}/${config.github.repo}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        ...this.getHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message,
                        content: btoa(JSON.stringify(content, null, 2)),
                        sha: currentFile.sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error(config.messages.errors.unknownError);
            }

            return true;
        } catch (error) {
            console.error('ファイル更新エラー:', error);
            throw error;
        }
    }

    // 投稿の取得
    async getSubmissions() {
        try {
            const data = await this.getFileContent('data/submissions.json');
            return data.submissions.filter(s => s.status === 'pending');
        } catch (error) {
            console.error('投稿取得エラー:', error);
            throw error;
        }
    }

    // お酒の情報の取得
    async getAlcohols() {
        try {
            const data = await this.getFileContent('data/alcohols.json');
            return data.alcohols;
        } catch (error) {
            console.error('お酒の情報取得エラー:', error);
            throw error;
        }
    }

    // 投稿の追加
    async addSubmission(submission) {
        try {
            // 必須フィールドの検証
            const requiredFields = config.schemas.submission.required;
            for (const field of requiredFields) {
                if (!submission[field]) {
                    throw new Error(`${field}は必須項目です`);
                }
            }

            // 現在の投稿を取得
            const data = await this.getFileContent('data/submissions.json');
            
            // 新しい投稿を追加
            data.submissions.push({
                ...submission,
                id: Date.now().toString(),
                status: 'pending',
                submittedAt: new Date().toISOString()
            });

            // ファイルを更新
            await this.updateFileContent(
                'data/submissions.json',
                data,
                `Add new submission: ${submission.name}`
            );

            return true;
        } catch (error) {
            console.error('投稿追加エラー:', error);
            throw error;
        }
    }

    // 投稿の承認
    async approveSubmission(id) {
        try {
            // 現在の投稿とお酒の情報を取得
            const [submissions, alcohols] = await Promise.all([
                this.getFileContent('data/submissions.json'),
                this.getFileContent('data/alcohols.json')
            ]);

            // 承認する投稿を探す
            const submissionIndex = submissions.submissions.findIndex(s => s.id === id);
            if (submissionIndex === -1) {
                throw new Error(config.messages.errors.submissionNotFound);
            }

            const submission = submissions.submissions[submissionIndex];
            submission.status = 'approved';
            submission.approvedAt = new Date().toISOString();
            submission.approvedBy = auth.email;

            // お酒の情報に追加
            alcohols.alcohols.push(submission);

            // 投稿から削除
            submissions.submissions.splice(submissionIndex, 1);

            // 両方のファイルを更新
            await Promise.all([
                this.updateFileContent(
                    'data/submissions.json',
                    submissions,
                    `Remove approved submission: ${submission.name}`
                ),
                this.updateFileContent(
                    'data/alcohols.json',
                    alcohols,
                    `Add approved alcohol: ${submission.name}`
                )
            ]);

            return true;
        } catch (error) {
            console.error('投稿承認エラー:', error);
            throw error;
        }
    }

    // 投稿の却下
    async rejectSubmission(id) {
        try {
            // 現在の投稿を取得
            const data = await this.getFileContent('data/submissions.json');

            // 却下する投稿を探す
            const submissionIndex = data.submissions.findIndex(s => s.id === id);
            if (submissionIndex === -1) {
                throw new Error(config.messages.errors.submissionNotFound);
            }

            // 投稿を削除
            data.submissions.splice(submissionIndex, 1);

            // ファイルを更新
            await this.updateFileContent(
                'data/submissions.json',
                data,
                `Reject submission: ${id}`
            );

            return true;
        } catch (error) {
            console.error('投稿却下エラー:', error);
            throw error;
        }
    }
}

// シングルトンインスタンスの作成
const dataManager = new DataManager();

// データマネージャーのエクスポート
export { dataManager }; 