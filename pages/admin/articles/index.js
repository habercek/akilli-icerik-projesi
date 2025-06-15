// pages/admin/articles/index.js

import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

// --- MODAL BİLEŞENİ (Onay Pencereleri İçin) ---
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

// --- ANA SAYFA BİLEŞENİ ---
function ArticlesPage({ articles }) {
    const router = useRouter();
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [translatingId, setTranslatingId] = useState(null);
    const [modal, setModal] = useState({ isOpen: false });

    // GÜNCELLENDİ: Performans iyileştirmesi için makaleleri bir haritaya yerleştir.
    // Bu, makale durumlarını ararken tüm diziyi tekrar tekrar taramak yerine anında erişim sağlar.
    const articleMap = useMemo(() => {
        const map = new Map();
        articles.forEach(article => {
            map.set(article.id, article);
        });
        return map;
    }, [articles]);

    // Seçili makaleleri durumlarına göre filtrelemek için
    const selectedArticlesByStatus = useMemo(() => {
        const ham = [];
        const cevrildi = [];
        selectedArticles.forEach(id => {
            const article = articleMap.get(id); // Haritadan anında bul
            if (article) {
                if (article.durum === 'ham') {
                    ham.push(id);
                } else if (article.durum === 'çevrildi') {
                    cevrildi.push(id);
                }
            }
        });
        return { ham, cevrildi };
    }, [selectedArticles, articleMap]);


    const handleSelectArticle = (id) => {
        setSelectedArticles(prevSelected =>
            prevSelected.includes(id)
                ? prevSelected.filter(articleId => articleId !== id)
                : [...prevSelected, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedArticles(articles.map(article => article.id));
        } else {
            setSelectedArticles([]);
        }
    };

    const handleDeleteClick = () => {
        if (selectedArticles.length === 0) {
            toast.error('Lütfen silmek için en az bir makale seçin.');
            return;
        }
        setModal({ 
            isOpen: true, 
            title: 'Makaleleri Sil',
            message: `${selectedArticles.length} makaleyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
        });
    };

    const confirmDelete = () => {
        setIsProcessing(true);
        setModal({ isOpen: false });

        const toastId = toast.loading('Seçilen makaleler siliniyor...');

        fetch('/api/delete-articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedArticles }),
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Silme sırasında bir hata oluştu.')});
            }
            return res.json();
        })
        .then(() => {
            toast.success('Makaleler başarıyla silindi!', { id: toastId, duration: 4000 });
            router.reload();
        })
        .catch((err) => {
            toast.error(`Hata: ${err.message}`, { id: toastId });
        })
        .finally(() => {
            setIsProcessing(false);
            setSelectedArticles([]);
        });
    };
    
    const handleTranslate = (articleId) => {
        setTranslatingId(articleId);
        
        const toastId = toast.loading('Makale çevriliyor...');

        fetch('/api/translate-article', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: articleId }),
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Çeviri sırasında bir hata oluştu.')});
            }
            return res.json();
        })
        .then(() => {
            toast.success('Makale başarıyla çevrildi!', { id: toastId, duration: 4000 });
            router.reload();
        })
        .catch((err) => {
             toast.error(`Hata: ${err.message}`, { id: toastId });
        })
        .finally(() => {
            setTranslatingId(null);
        });
    };
    
    const handleBatchAction = async (actionType) => {
        const isTranslate = actionType === 'translate';
        const targetIds = isTranslate ? selectedArticlesByStatus.ham : selectedArticlesByStatus.cevrildi;
        const apiEndpoint = isTranslate ? '/api/batch-translate' : '/api/batch-optimize';
        const loadingMessage = isTranslate ? 'Seçilen makaleler çevriliyor...' : 'Seçilen makaleler optimize ediliyor...';
        
        if (targetIds.length === 0) {
            toast.error(`Bu işlem için uygun durumda makale seçilmedi.`);
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading(loadingMessage);

        fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: targetIds }),
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || 'Toplu işlem sırasında bir hata oluştu.')});
            }
            return res.json();
        })
        .then((result) => {
            toast.success(result.message, { id: toastId, duration: 6000 });
            router.reload();
        })
        .catch((err) => {
             toast.error(`Hata: ${err.message}`, { id: toastId });
        })
        .finally(() => {
            setIsProcessing(false);
            setSelectedArticles([]);
        });
    };

    const allSelected = articles.length > 0 && selectedArticles.length === articles.length;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' }}>
            <Toaster 
                position="bottom-right"
                toastOptions={{
                    style: { fontSize: '16px', padding: '16px', minWidth: '250px' },
                    error: { duration: 5000 }
                }}
            />
            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={confirmDelete}
                onCancel={() => setModal({ isOpen: false })}
            />
            <style jsx global>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 25px; border-radius: 8px; text-align: center; width: 90%; max-width: 400px; }
                .modal-actions { margin-top: 20px; display: flex; justify-content: center; gap: 15px; }
                .button-danger { background-color: #e74c3c; color: white; border:none; padding: 10px 15px; font-size: 14px; border-radius: 4px; cursor: pointer; }
                .button-secondary { background-color: #bdc3c7; color: #2c3e50; border:none; padding: 10px 15px; font-size: 14px; border-radius: 4px; cursor: pointer; }
                button:disabled { cursor: not-allowed; opacity: 0.6; }
            `}</style>
            
            <a href="/admin" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Ana Yönetim Paneline Geri Dön</a>
            <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale Yönetimi</h1>
            <p>Veritabanında bulunan toplam makale sayısı: {articles.length}</p>
            
            <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => handleBatchAction('translate')}
                    disabled={isProcessing || selectedArticlesByStatus.ham.length === 0}
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {`Seçilenleri Çevir (${selectedArticlesByStatus.ham.length})`}
                </button>
                 <button 
                    onClick={() => handleBatchAction('optimize')}
                    disabled={isProcessing || selectedArticlesByStatus.cevrildi.length === 0}
                    style={{ backgroundColor: '#6f42c1', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {`Seçilenleri Optimize Et (${selectedArticlesByStatus.cevrildi.length})`}
                </button>
                <button 
                    onClick={handleDeleteClick} 
                    disabled={isProcessing || selectedArticles.length === 0}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', marginLeft: 'auto' }}
                >
                    {`Seçilenleri Sil (${selectedArticles.length})`}
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>
                                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: '18px', height: '18px' }} />
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Başlık</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Durum</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Eklenme Tarihi</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id} style={{ borderBottom: '1px solid #eee', backgroundColor: selectedArticles.includes(article.id) ? '#fff3cd' : 'transparent' }}>
                                <td style={{ padding: '12px' }}>
                                    <input type="checkbox" checked={selectedArticles.includes(article.id)} onChange={() => handleSelectArticle(article.id)} style={{ width: '18px', height: '18px' }}/>
                                </td>
                                <td style={{ padding: '12px', minWidth: '300px' }}>{article.title}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        backgroundColor: article.durum === 'ham' ? '#ffc107' : (article.durum === 'çevrildi' ? '#17a2b8' : '#28a745'), 
                                        color: article.durum === 'ham' ? 'black' : 'white', 
                                        padding: '3px 8px', borderRadius: '12px', 
                                        fontSize: '12px', fontWeight: 'bold' 
                                    }}>
                                        {article.durum}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '14px', whiteSpace: 'nowrap' }}>{new Date(article.eklenmeTarihi).toLocaleString('tr-TR')}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {article.durum === 'ham' && (
                                        <button 
                                            onClick={() => handleTranslate(article.id)}
                                            disabled={translatingId === article.id || isProcessing}
                                            style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                                        >
                                            {translatingId === article.id ? 'Çevriliyor...' : 'Türkçeye Çevir'}
                                        </button>
                                    )}
                                    {article.durum !== 'ham' && (
                                        <a 
                                            href={`/admin/articles/${article.id}`}
                                            style={{ 
                                                display: 'inline-block',
                                                padding: '5px 10px', 
                                                fontSize: '12px', 
                                                cursor: 'pointer', 
                                                backgroundColor: '#17a2b8', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '5px', 
                                                textDecoration: 'none' 
                                            }}
                                        >
                                            İncele ve Düzenle
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Gösterilecek makale bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export async function getServerSideProps() {
    try {
        const articlesRef = collection(db, 'articles');
        const querySnapshot = await getDocs(articlesRef);
        const articles = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || 'Başlık Yok',
                durum: data.durum || 'Bilinmiyor',
                eklenmeTarihi: data.eklenmeTarihi?.toDate()?.toISOString() || new Date().toISOString(),
            };
        });
        articles.sort((a, b) => new Date(b.eklenmeTarihi) - new Date(a.eklenmeTarihi));
        return { props: { articles } };
    } catch (error) {
        console.error("Makaleleri çekerken hata:", error);
        return { props: { articles: [] } };
    }
}

export default ArticlesPage;
