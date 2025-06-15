// pages/admin/articles/[id].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function OptimizationResults({ data }) {
    if (!data) return null;
    const renderSubheadings = () => {
        if (Array.isArray(data.subheadings)) {
            return (<ul>{data.subheadings.map((sh, index) => <li key={index}>{sh}</li>)}</ul>);
        }
        return <p>{data.subheadings}</p>;
    };
    return (
        <div className="results-container">
            <h3>Optimizasyon Sonuçları</h3>
            <div className="result-item"><strong>H1 Başlığı:</strong><p>{data.h1_title}</p></div>
            <div className="result-item"><strong>Meta Açıklaması:</strong><p>{data.meta_description}</p></div>
            <div className="result-item"><strong>Özet:</strong><p>{data.summary}</p></div>
            <div className="result-item"><strong>Alt Başlık Önerileri:</strong>{renderSubheadings()}</div>
        </div>
    );
}

function EditArticlePage({ articleData }) {
    const router = useRouter();
    const [translatedContent, setTranslatedContent] = useState(articleData.ceviri_icerik || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('preview');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizeMessage, setOptimizeMessage] = useState('');
    const [optimizedData, setOptimizedData] = useState(articleData.seo_data || null);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true); setMessage(''); setError('');
        try {
            const { id } = router.query;
            const response = await fetch('/api/update-article', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, content: translatedContent }),
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Makale güncellenirken bir hata oluştu.'); }
            setMessage('Değişiklikler başarıyla kaydedildi!');
        } catch (err) { setError(`Hata: ${err.message}`); } finally { setIsSaving(false); }
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setOptimizeMessage('Optimizasyon başlatıldı, yapay zeka düşünürken lütfen bekleyin...');
        setOptimizedData(null); setError('');
        try {
            const { id } = router.query;
            // GÜNCELLENDİ: API adresi yeni dosya adıyla değiştirildi
            const response = await fetch('/api/run-gemini-optimizer', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, content: translatedContent }),
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.error || 'Bilinmeyen bir optimizasyon hatası oluştu.'); }
            setOptimizeMessage(result.message);
            setOptimizedData(result.data);
        } catch (err) { setOptimizeMessage(`Hata: ${err.message}`); } finally { setIsOptimizing(false); }
    };

    if (!articleData) { return <div>Makale yükleniyor veya bulunamadı...</div>; }

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
             <style jsx global>{`
                .article-preview img { display: block !important; float: none !important; margin: 0 auto 1rem auto !important; max-width: 100%; height: auto; }
                .results-container { margin-top: 25px; padding: 20px; border: 1px solid #1abc9c; border-radius: 8px; background-color: #f0fdfa; }
                .result-item { margin-bottom: 15px; } .result-item strong { display: block; margin-bottom: 5px; color: #16a085; }
                .result-item p, .result-item ul { margin: 0; } .result-item ul { padding-left: 20px; }
            `}</style>
            <a href="/admin/articles" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Makale Listesine Geri Dön</a>
            <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale İncele ve Düzenle</h1>
            <h3 style={{ fontWeight: 'normal' }}>{articleData.title}</h3>
            <div>
                <form onSubmit={handleSave}>
                    <h2>Çevrilmiş Metin</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <button type="button" onClick={() => setViewMode('preview')} disabled={viewMode === 'preview'} style={{ padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', backgroundColor: viewMode === 'preview' ? '#007bff' : 'white', color: viewMode === 'preview' ? 'white' : 'black' }}>Canlı Önizleme</button>
                        <button type="button" onClick={() => setViewMode('html')} disabled={viewMode === 'html'} style={{ marginLeft: '0.5rem', padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', backgroundColor: viewMode === 'html' ? '#007bff' : 'white', color: viewMode === 'html' ? 'white' : 'black' }}>HTML Kodunu Düzenle</button>
                    </div>
                    {viewMode === 'preview' ? (
                        <div className="article-preview" style={{ width: '100%', height: '424px', border: '1px solid #ccc', borderRadius: '5px', padding: '10px', backgroundColor: '#f9f9f9', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: translatedContent }} />
                    ) : (
                        <textarea value={translatedContent} onChange={(e) => setTranslatedContent(e.target.value)} style={{ width: '100%', height: '424px', padding: '10px', border: '1px solid #007bff', borderRadius: '5px', fontFamily: 'monospace' }} />
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</button>
                        <button type="button" onClick={handleOptimize} disabled={isOptimizing || isSaving} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{isOptimizing ? 'Optimize Ediliyor...' : 'Yapay Zeka ile Optimize Et →'}</button>
                    </div>
                    {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
                    {error && <p style={{ marginTop: '10px', color: 'red' }}>{error}</p>}
                </form>
                {optimizeMessage && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{optimizeMessage}</p>}
                <OptimizationResults data={optimizedData} />
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    try {
        const { id } = context.params;
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) { return { notFound: true }; }
        const data = docSnap.data();
        const articleData = { id: docSnap.id, title: data.title || 'Başlık Yok', content: data.content || '', ceviri_icerik: data.ceviri_icerik || '', seo_data: data.seo_data || null };
        return { props: { articleData } };
    } catch (error) {
        console.error("Makale detayı çekerken hata:", error);
        return { props: { articleData: null } };
    }
}

export default EditArticlePage;
