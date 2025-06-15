// pages/api/fetch-news.js
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import RssParser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const parser = new RssParser();
    const storage = getStorage();

    try {
        // Site ayarlarından RSS kaynaklarını al
        const settingsRef = doc(db, 'sites', 'test-sitesi');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists() || !settingsSnap.data().rssKaynaklari) {
            return res.status(404).json({ error: "Kayıtlı RSS kaynağı bulunamadı." });
        }
        const rssUrls = settingsSnap.data().rssKaynaklari;

        let totalAdded = 0;
        
        for (const url of rssUrls) {
            try {
                const feed = await parser.parseURL(url);

                for (const item of feed.items) {
                    // Bu haber daha önce eklenmiş mi diye kontrol et
                    const articlesRef = collection(db, 'articles');
                    const q = query(articlesRef, where("original_link", "==", item.link));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        console.log(`Makale zaten var, atlanıyor: ${item.title}`);
                        continue; // Makale zaten varsa bir sonrakine geç
                    }

                    let content = item.content || item['content:encoded'] || '';
                    
                    // --- YENİ: Görsel İşleme Mantığı Başlangıcı ---
                    const $ = cheerio.load(content);
                    const imageTags = $('img');
                    const mediaUrls = [];

                    for (let i = 0; i < imageTags.length; i++) {
                        const img = imageTags[i];
                        const originalImageUrl = $(img).attr('src');

                        if (originalImageUrl) {
                            try {
                                // 1. Resmi indir
                                const response = await axios.get(originalImageUrl, { responseType: 'arraybuffer' });
                                const imageBuffer = Buffer.from(response.data, 'binary').toString('base64');
                                const mimeType = response.headers['content-type'];

                                // 2. Firebase Storage'a yükle
                                const articleIdForStorage = item.link.replace(/[^a-zA-Z0-9]/g, '_'); // Linkten dosya adı oluştur
                                const storageRef = ref(storage, `article_images/${articleIdForStorage}/${Date.now()}_${i}.jpg`);
                                
                                await uploadString(storageRef, imageBuffer, 'base64', { contentType: mimeType });
                                
                                // 3. Yeni, kalıcı URL'i al
                                const newImageUrl = await getDownloadURL(storageRef);
                                mediaUrls.push(newImageUrl);
                                
                                // 4. İçerikteki eski URL'i yeni URL ile değiştir
                                $(img).attr('src', newImageUrl);

                            } catch (imageError) {
                                console.error(`Görsel işlenirken hata oluştu: ${originalImageUrl}`, imageError.message);
                                // Hata olsa bile devam et, en azından metin kaydedilir.
                            }
                        }
                    }
                    content = $.html(); // Değiştirilmiş içeriği al
                    // --- YENİ: Görsel İşleme Mantığı Sonu ---

                    // Veritabanına yeni makaleyi ekle
                    await addDoc(articlesRef, {
                        title: item.title,
                        content: content, // Artık içinde kalıcı resim linkleri var
                        ceviri_icerik: '',
                        seo_data: null,
                        durum: 'ham', // Başlangıç durumu
                        eklenmeTarihi: new Date(item.isoDate),
                        original_link: item.link,
                        media_urls: mediaUrls, // Kendi depomuzdaki resimlerin linkleri
                    });
                    totalAdded++;
                }
            } catch (feedError) {
                console.error(`RSS kaynağı işlenirken hata oluştu (${url}):`, feedError.message);
                // Bir feed bozuksa diğerlerini işlemeye devam et
            }
        }

        res.status(200).json({ message: `${totalAdded} yeni makale başarıyla eklendi.` });

    } catch (error) {
        console.error("Haberler çekilirken bir hata oluştu:", error);
        res.status(500).json({ error: error.message });
    }
}
