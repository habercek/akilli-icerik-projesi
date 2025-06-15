// pages/admin/articles/[id].js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

// Küçük bir JSON görüntüleyici bileşeni
const JsonViewer = ({ data }) => (
    <pre style={{
        background: '#282c34',
        color: '#abb2bf',
        padding: '15px',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontSize: '14px',
        lineHeight: '1.5'
    }}>
        {JSON.stringify(data, null, 2)}
    </pre>
);

export default function ArticleDetailPage({ article }) {
    const router = useRouter();
    const [isOptimizing, setIsOptimizing] = useState(false);

    if (!article) {
        return <div>Makale yükleniyor veya bulunamadı...</div>;
    }

    const handleOptimize = async () => {
        setIsOptimizing(true);
        const toastId = toast.loading('Makale zenginleştiriliyor ve optimize ediliyor...');

        try {
            const res = await fetch('/api/run-gemini-optimizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: article.id }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Bilinmeyen bir hata oluştu.');
            }

            toast.success('Başarıyla tamamlandı! Sayfa yenileniyor...', { id: toastId });
            setTimeout(() => router.reload(), 2000);

        } catch (error) {
            toast.error(`Hata: ${error.message}`, { id: toastId });
            setIsOptimizing(false);
        }
    };

    const seo = article.seo_data || {};

    return (
        <>
            <Toaster position="bottom-right" />
            <style jsx global>{`
                body { background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
                .container { max-width: 1200px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .back-link { color: #007bff; text-decoration: none; }
                .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                .content-area h2 { border-left: 4px solid #007bff; padding-left: 10px; }
                .content-display { border: 1px solid #e9ecef; padding: 20px; border-radius: 5px; background: #f8f9fa; }
                .summary-box { background: #e9f7fd; border: 1px solid #bce8f1; border-left: 5px solid #31708f; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary-box h3 { margin-top: 0; color: #31708f; }
                .faq-section { background: #fef8e4; border: 1px solid #fbeebc; border-left: 5px solid #8a6d3b; padding: 15px; margin-top: 20px; border-radius: 5px; }
                .faq-section h4 { color: #8a6d3b; }
                .seo-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
            `}</style>
            <div className="container">
                <div className="header">
                    <div>
                        <a href="/admin/articles" className="back-link">&larr; Makale Listesine Dön</a>
                        <h1>{article.title}</h1>
                        <p><strong>Durum:</strong> {article.durum}</p>
                    </div>
                    {article.durum !== 'zenginleştirildi' && (
                         <button onClick={handleOptimize} disabled={isOptimizing}>
                            {isOptimizing ? 'İşlem Sürüyor...' : 'Zenginleştir ve Optimize Et'}
                        </button>
                    )}
                </div>

                <div className="main-grid">
                    <div className="content-area">
                        <h2>İçerik Önizlemesi</h2>
                        <div
                            className="content-display"
                            dangerouslySetInnerHTML={{ __html: article.zenginlestirilmis_icerik || article.ceviri_icerik || article.content || '<p>İçerik bulunamadı.</p>' }}
                        />
                    </div>
                    <div className="sidebar">
                        <h2>SEO Verileri</h2>
                        <div className="seo-card">
                           <p><strong>H1 Başlığı:</strong> {seo.h1_title || 'N/A'}</p>
                           <p><strong>Meta Açıklaması:</strong> {seo.meta_description || 'N/A'}</p>
                           <p><strong>Anahtar Kelimeler:</strong> {(seo.keywords || []).join(', ') || 'N/A'}</p>
                           <p><strong>Önerilen Alt Başlıklar:</strong> {(seo.subheadings || []).join(', ') || 'N/A'}</p>
                           <hr/>
                           <h3>Yapısal Veri (Schema)</h3>
                           <JsonViewer data={seo.schema_markup || { message: "Henüz oluşturulmadı."}} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    try {
        const { id } = context.params;
        const articleRef = doc(db, 'articles', id);
        const docSnap = await getDoc(articleRef);

        if (!docSnap.exists()) {
            return { notFound: true };
        }

        const data = docSnap.data();
        // Firestore'dan gelen timestamp'leri serileştirilebilir formata dönüştür
        const article = {
            id: docSnap.id,
            title: data.title || null,
            content: data.content || null,
            ceviri_icerik: data.ceviri_icerik || null,
            zenginlestirilmis_icerik: data.zenginlestirilmis_icerik || null,
            seo_data: data.seo_data || null,
            durum: data.durum || null,
        };

        return { props: { article } };
    } catch (error) {
        console.error("Makale detayı alınırken hata:", error);
        return { props: { article: null } };
    }
}
