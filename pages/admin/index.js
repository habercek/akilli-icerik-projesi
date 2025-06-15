// pages/admin/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- SİMGELER (SVG) ---
const IconRss = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.73 0 14 6.27 14 14M6 13a7 7 0 017 7m-7-14v0a1 1 0 112 0 1 1 0 01-2 0z" /></svg>;
const IconArticle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconKey = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1.258l.017-.006a6 6 0 015.743-7.743z" /></svg>;
const IconGemini = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4m10 4l2 2-2 2m-3-4l-2 2 2 2m7-12l-2 2-2-2m-3 4l2-2-2-2" /></svg>;
const IconMenu = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>;

// --- MODAL BİLEŞENİ ---
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="button-secondary">İptal</button>
                    <button onClick={onConfirm} className="button-danger">Onayla</button>
                </div>
            </div>
        </div>
    );
}


// --- API ANAHTAR YÖNETİM BİLEŞENİ ---
function ApiKeyManager({ title, description, placeholder, initialApiKeys = [], onAddKey, onDeleteKey, isSubmitting, deletingKey, error }) {
    const [newApiKey, setNewApiKey] = useState('');
    const [modal, setModal] = useState({ isOpen: false, keyToDelete: null });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newApiKey.trim()) return;
        onAddKey(newApiKey);
        setNewApiKey('');
    };

    const handleDeleteClick = (key) => {
        setModal({ isOpen: true, keyToDelete: key });
    };

    const confirmDelete = () => {
        onDeleteKey(modal.keyToDelete);
        setModal({ isOpen: false, keyToDelete: null });
    };

    const maskApiKey = (key) => {
        if (!key || key.length < 15) return '********';
        return `********-****-****-****-${key.slice(-15)}`;
    };

    return (
        <div className="content-box">
             <ConfirmModal
                isOpen={modal.isOpen}
                title="API Anahtarını Sil"
                message="Bu anahtarı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                onConfirm={confirmDelete}
                onCancel={() => setModal({ isOpen: false, keyToDelete: null })}
            />
            <h2>{title}</h2>
            <p className="description">{description}</p>
            <form onSubmit={handleAddSubmit} className="form-inline">
                <input
                    type="text"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={placeholder}
                    required
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Ekleniyor...' : 'Yeni Anahtar Ekle'}
                </button>
            </form>
            {error && <p className="error-message">Hata: {error}</p>}
            <h4>Kayıtlı Anahtarlar:</h4>
            {initialApiKeys.length > 0 ? (
                <ul className="item-list">
                    {initialApiKeys.map((apiKey, index) => (
                        <li key={index}>
                            <span>{maskApiKey(apiKey)}</span>
                            <button onClick={() => handleDeleteClick(apiKey)} disabled={deletingKey === apiKey} className="button-danger">
                                {deletingKey === apiKey ? 'Siliniyor...' : 'Sil'}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="description">Henüz kayıtlı API anahtarı yok.</p>
            )}
        </div>
    );
}

// --- RSS YÖNETİM BİLEŞENİ ---
function RssManager({ initialRssUrls = [], onAddRss, onDeleteRss, onFetchNews, isSubmittingRss, deletingUrl, isFetching, fetchMessage }) {
    const [newRssUrl, setNewRssUrl] = useState('');
    const [modal, setModal] = useState({ isOpen: false, urlToDelete: null });
    
    const handleAddSubmit = (e) => {
        e.preventDefault();
        if(!newRssUrl.trim()) return;
        onAddRss(newRssUrl);
        setNewRssUrl('');
    };

    const handleDeleteClick = (url) => {
        setModal({ isOpen: true, urlToDelete: url });
    };

    const confirmDelete = () => {
        onDeleteRss(modal.urlToDelete);
        setModal({ isOpen: false, urlToDelete: null });
    };

    return (
        <div className="content-box">
            <ConfirmModal
                isOpen={modal.isOpen}
                title="RSS Kaynağını Sil"
                message="Bu RSS kaynağını silmek istediğinizden emin misiniz?"
                onConfirm={confirmDelete}
                onCancel={() => setModal({ isOpen: false, urlToDelete: null })}
            />
            <h2>Otomasyon ve RSS Yönetimi</h2>
            
            <div className="subsection">
                <h4>Otomasyon</h4>
                <button onClick={onFetchNews} disabled={isFetching}>
                    {isFetching ? 'İşlem Sürüyor...' : 'Tüm Kaynaklardan Haberleri Çek'}
                </button>
                {fetchMessage && <p className="description" style={{marginTop: '10px'}}>{fetchMessage}</p>}
            </div>

            <div className="subsection">
                <h4>Yeni Kaynak Ekle</h4>
                <form onSubmit={handleAddSubmit} className="form-inline">
                    <input
                        type="url" value={newRssUrl} onChange={(e) => setNewRssUrl(e.target.value)}
                        placeholder="https://ornek.com/rss.xml" required
                    />
                    <button type="submit" disabled={isSubmittingRss}>
                        {isSubmittingRss ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                </form>
            </div>

            <div className="subsection">
                <h4>Kayıtlı RSS Kaynakları</h4>
                {initialRssUrls.length > 0 ? (
                     <ul className="item-list">
                        {initialRssUrls.map((kaynak, index) => (
                            <li key={index}>
                                <span style={{wordBreak: 'break-all'}}>{kaynak}</span>
                                <button onClick={() => handleDeleteClick(kaynak)} disabled={deletingUrl === kaynak} className="button-danger">
                                    {deletingUrl === kaynak ? 'Siliniyor...' : 'Sil'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="description">Henüz kayıtlı RSS kaynağı yok.</p>
                )}
            </div>
        </div>
    );
}

// --- ANA YÖNETİM SAYFASI ---
function AdminPage({ siteData }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('rss'); // 'rss', 'deepl', 'gemini'

    // --- State Yönetimi ---
    const [isSubmittingRss, setIsSubmittingRss] = useState(false);
    const [deletingUrl, setDeletingUrl] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchMessage, setFetchMessage] = useState('');
    const [isSubmittingKey, setIsSubmittingKey] = useState(false);
    const [deletingKey, setDeletingKey] = useState(null);
    const [apiKeyError, setApiKeyError] = useState(null);

    // --- Fonksiyonlar ---
    const handleAddRss = async (url) => {
        setIsSubmittingRss(true);
        try {
            const response = await fetch('/api/add-rss', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error('RSS eklenemedi.');
            router.reload();
        } catch (err) { alert(err.message); setIsSubmittingRss(false); }
    };

    const handleDeleteRss = async (url) => {
        setDeletingUrl(url);
        try {
            const response = await fetch('/api/delete-rss', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error('RSS silinemedi.');
            router.reload();
        } catch (err) { alert(err.message); setDeletingUrl(null); }
    };

    const handleFetchNews = async () => {
        setIsFetching(true);
        setFetchMessage('Haberler çekiliyor, lütfen bekleyin...');
        try {
            const response = await fetch('/api/fetch-news', { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Haberler çekilirken bir hata oluştu.');
            setFetchMessage(result.message);
        } catch (err) {
            setFetchMessage(`Hata: ${err.message}`);
        } finally { setIsFetching(false); }
    };

    const handleAddApiKey = (apiEndpoint) => async (key) => {
        setIsSubmittingKey(true); setApiKeyError(null);
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }),
            });
            if (!response.ok) throw new Error('API anahtarı eklenemedi.');
            router.reload();
        } catch (err) { setApiKeyError(err.message); } finally { setIsSubmittingKey(false); }
    };

    const handleDeleteApiKey = (apiEndpoint) => async (key) => {
        setDeletingKey(key); setApiKeyError(null);
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }),
            });
            if (!response.ok) throw new Error('API anahtarı silinemedi.');
            router.reload();
        } catch (err) { setApiKeyError(err.message); } finally { setDeletingKey(null); }
    };

    const menuItems = [
        { id: 'rss', label: 'RSS Yönetimi', icon: IconRss, action: () => setActiveView('rss') },
        { id: 'articles', label: 'Makale Yönetimi', icon: IconArticle, action: () => router.push('/admin/articles') },
        { id: 'deepl', label: 'DeepL API', icon: IconKey, action: () => setActiveView('deepl') },
        { id: 'gemini', label: 'Gemini API', icon: IconGemini, action: () => setActiveView('gemini') },
    ];

    return (
        <>
            <style jsx global>{`
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif; background-color: #f4f7f6; }
                .admin-layout { display: flex; height: 100vh; }
                .sidebar { background-color: #2c3e50; color: white; transition: width 0.3s ease; padding-top: 20px; }
                .sidebar.open { width: 250px; }
                .sidebar.closed { width: 70px; }
                .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; margin-bottom: 30px; }
                .sidebar.closed .sidebar-header h2 { display: none; }
                .menu-toggle { background: none; border: none; color: white; cursor: pointer; padding: 5px; }
                .nav-menu { list-style: none; padding: 0; margin: 0; }
                .nav-item a { display: flex; align-items: center; padding: 15px 20px; color: #bdc3c7; text-decoration: none; transition: background-color 0.2s, color 0.2s; white-space: nowrap; }
                .nav-item a:hover { background-color: #34495e; color: white; }
                .nav-item a.active { background-color: #1abc9c; color: white; }
                .nav-icon { width: 24px; height: 24px; margin-right: 15px; }
                .sidebar.closed .nav-label { display: none; }
                .sidebar.closed .nav-item a { justify-content: center; }
                .sidebar.closed .nav-icon { margin-right: 0; }
                .main-content { flex-grow: 1; padding: 30px; overflow-y: auto; }
                .content-box { background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .description { font-size: 14px; color: #6c757d; margin-top: -10px; margin-bottom: 20px; }
                .form-inline { display: flex; align-items: center; margin-bottom: 20px; }
                .form-inline input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-right: 10px; }
                button { padding: 10px 15px; font-size: 14px; border-radius: 4px; border: none; cursor: pointer; transition: background-color 0.2s; }
                button:disabled { background-color: #ccc; cursor: not-allowed; }
                .button-danger { background-color: #e74c3c; color: white; }
                .button-danger:hover { background-color: #c0392b; }
                .button-secondary { background-color: #bdc3c7; color: #2c3e50; }
                .item-list { list-style: none; padding: 0; }
                .item-list li { background-color: #f8f9fa; padding: 10px 15px; border-radius: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
                .subsection { border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
                .error-message { color: #e74c3c; margin-top: 10px; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 25px; border-radius: 8px; text-align: center; width: 90%; max-width: 400px; }
                .modal-actions { margin-top: 20px; display: flex; justify-content: center; gap: 15px; }
            `}</style>
            <div className="admin-layout">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <h2>Yönetim</h2>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="menu-toggle">
                            <IconMenu className="nav-icon" />
                        </button>
                    </div>
                    <ul className="nav-menu">
                        {menuItems.map(item => (
                             <li className="nav-item" key={item.id}>
                                <a href="#" onClick={(e) => { e.preventDefault(); item.action(); }} className={activeView === item.id ? 'active' : ''}>
                                    <item.icon className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
                <main className="main-content">
                    <h1>Kontrol Paneli</h1>
                     {activeView === 'rss' && (
                        <RssManager
                            initialRssUrls={siteData.rssKaynaklari}
                            onAddRss={handleAddRss}
                            onDeleteRss={handleDeleteRss}
                            onFetchNews={handleFetchNews}
                            isSubmittingRss={isSubmittingRss}
                            deletingUrl={deletingUrl}
                            isFetching={isFetching}
                            fetchMessage={fetchMessage}
                        />
                    )}
                    {activeView === 'deepl' && (
                         <ApiKeyManager
                            title="API Anahtar Yönetimi (DeepL)"
                            description="Kullanılabilir DeepL API anahtarlarını buraya ekleyin. Sistem, kota dolduğunda otomatik olarak bir sonrakine geçecektir."
                            placeholder="Yeni DeepL API Anahtarını Yapıştırın"
                            initialApiKeys={siteData.deeplKeys}
                            onAddKey={handleAddApiKey('/api/add-api-key')}
                            onDeleteKey={handleDeleteApiKey('/api/delete-api-key')}
                            isSubmitting={isSubmittingKey}
                            deletingKey={deletingKey}
                            error={apiKeyError}
                        />
                    )}
                    {activeView === 'gemini' && (
                        <ApiKeyManager
                            title="API Anahtar Yönetimi (Gemini)"
                            description="Kullanılabilir Gemini API anahtarlarını buraya ekleyin. Sistem, kota dolduğunda otomatik olarak bir sonrakine geçecektir."
                            placeholder="Yeni Gemini API Anahtarını Yapıştırın"
                            initialApiKeys={siteData.geminiKeys}
                            onAddKey={handleAddApiKey('/api/add-gemini-key')}
                            onDeleteKey={handleDeleteApiKey('/api/delete-gemini-key')}
                            isSubmitting={isSubmittingKey}
                            deletingKey={deletingKey}
                            error={apiKeyError}
                        />
                    )}
                </main>
            </div>
        </>
    );
}

// --- VERİ ÇEKME FONKSİYONU ---
export async function getServerSideProps() {
    try {
        const siteRef = doc(db, 'sites', 'test-sitesi');
        const docSnap = await getDoc(siteRef);

        let siteData = { rssKaynaklari: [], deeplKeys: [], geminiKeys: [] };

        if (docSnap.exists()) {
            const data = docSnap.data();
            siteData.rssKaynaklari = data.rssKaynaklari || [];
            siteData.deeplKeys = data.deepl_keys || [];
            siteData.geminiKeys = data.gemini_keys || []; // Yeni eklendi
        }
        
        return { props: { siteData } };

    } catch (error) {
        console.error("Firebase'den veri çekerken hata:", error);
        return { props: { siteData: { rssKaynaklari: [], deeplKeys: [], geminiKeys: [] } } };
    }
}

export default AdminPage;
