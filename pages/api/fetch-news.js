// pages/api/fetch-news.js

import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import Parser from 'rss-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const parser = new Parser();

  try {
    // 1. Kayıtlı RSS kaynaklarını Firebase'den al
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const docSnap = await getDoc(siteRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Site yapılandırması bulunamadı.' });
    }

    const { rssKaynaklari } = docSnap.data();
    if (!rssKaynaklari || rssKaynaklari.length === 0) {
      return res.status(400).json({ error: 'Kayıtlı RSS kaynağı bulunamadı.' });
    }

    let toplamEklenenMakale = 0;

    // 2. Her bir RSS kaynağını döngüye al
    for (const url of rssKaynaklari) {
      try {
        const feed = await parser.parseURL(url);
        
        // 3. Her bir haberi (item) döngüye al
        for (const item of feed.items) {
          // 4. Bu haber daha önce eklenmiş mi diye kontrol et (URL veya guid ile)
          const articleId = item.guid || item.link;
          const articlesRef = collection(db, 'articles');
          const q = query(articlesRef, where("articleId", "==", articleId));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            // 5. Eğer daha önce eklenmemişse, veritabanına yeni bir 'article' olarak ekle
            await addDoc(articlesRef, {
              articleId: articleId,
              title: item.title || '',
              link: item.link || '',
              pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.content || item.contentSnippet || '',
              sourceFeed: url,
              durum: 'ham', // Durumu 'ham' (işlenmemiş) olarak ayarla
              eklenmeTarihi: new Date(),
            });
            toplamEklenenMakale++;
          }
        }
      } catch (feedError) {
        console.error(`RSS kaynağı işlenirken hata oluştu (${url}):`, feedError.message);
        // Bir feed bozuksa diğerlerini işlemeye devam et
      }
    }

    res.status(200).json({ message: `${toplamEklenenMakale} yeni makale başarıyla eklendi.` });

  } catch (error) {
    console.error('Haber çekme API Hatası:', error);
    res.status(500).json({ error: 'Haberler çekilirken sunucuda bir hata oluştu.' });
  }
}
