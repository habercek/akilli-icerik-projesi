// pages/api/add-gemini-key.js

import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { key } = req.body;

    // Gelen verinin geçerli olup olmadığını kontrol et
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({ error: 'Geçerli bir API anahtarı girilmelidir.' });
    }

    const docRef = doc(db, 'sites', 'test-sitesi');
    
    // Yeni anahtarı 'gemini_keys' dizisine atomik olarak ekle.
    // arrayUnion, anahtar zaten dizide varsa mükerrer kayıt oluşturmaz.
    await updateDoc(docRef, {
      gemini_keys: arrayUnion(key.trim())
    });

    res.status(200).json({ message: 'Gemini API anahtarı başarıyla eklendi.' });

  } catch (error) {
    console.error('Gemini Anahtarı Ekleme API Hatası:', error);
    res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  }
}
