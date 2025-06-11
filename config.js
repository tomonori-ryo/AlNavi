// 設定ファイル
const config = {
    // GitHub API設定
    github: {
        owner: 'tomonori-ryo',  // GitHubのユーザー名
        repo: 'AlNavi',         // リポジトリ名
        // トークンは環境変数から取得
        get token() {
            return localStorage.getItem('github_token') || '';
        },
        set token(value) {
            localStorage.setItem('github_token', value);
        }
    },

    // ImgBB API設定
    imgbb: {
        // APIキーは環境変数から取得
        get apiKey() {
            return localStorage.getItem('imgbb_api_key') || '';
        },
        set apiKey(value) {
            localStorage.setItem('imgbb_api_key', value);
        }
    },

    // 管理者認証設定
    admin: {
        // 本番環境ではFirebase Authを使用
        get isAuthenticated() {
            return localStorage.getItem('admin_authenticated') === 'true';
        },
        set isAuthenticated(value) {
            localStorage.setItem('admin_authenticated', value.toString());
        }
    },

    // エラーメッセージ
    messages: {
        errors: {
            fetchSubmissions: '投稿の取得に失敗しました',
            fetchAlcohols: 'お酒の情報の取得に失敗しました',
            authentication: '認証に失敗しました',
            submissionNotFound: '投稿が見つかりません',
            invalidToken: 'GitHubトークンが無効です',
            invalidApiKey: 'ImgBB APIキーが無効です',
            networkError: 'ネットワークエラーが発生しました',
            unknownError: '予期せぬエラーが発生しました'
        },
        success: {
            login: 'ログインに成功しました',
            logout: 'ログアウトしました',
            approve: '投稿を承認しました',
            reject: '投稿を却下しました',
            submit: '投稿を受け付けました'
        }
    },

    // データ構造の定義
    schemas: {
        submission: {
            required: ['id', 'name', 'type', 'description', 'taste', 'priceRange', 'alcoholContent'],
            optional: ['origin', 'imageUrl', 'status', 'submittedAt', 'approvedAt', 'approvedBy']
        }
    }
};

// 設定の検証
function validateConfig() {
    const errors = [];

    if (!config.github.owner) {
        errors.push('GitHubのユーザー名が設定されていません');
    }
    if (!config.github.repo) {
        errors.push('リポジトリ名が設定されていません');
    }
    if (!config.github.token) {
        errors.push('GitHubトークンが設定されていません');
    }
    if (!config.imgbb.apiKey) {
        errors.push('ImgBB APIキーが設定されていません');
    }

    return errors;
}

// 設定の初期化
function initializeConfig() {
    const errors = validateConfig();
    if (errors.length > 0) {
        console.error('設定エラー:', errors);
        return false;
    }
    return true;
}

// 設定のエクスポート
export { config, validateConfig, initializeConfig }; 