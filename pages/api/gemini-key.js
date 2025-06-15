// pages/api/add-gemini-key.js

import { db } from '../../firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({ error: 'Geçerli bir API anahtarı girilmelidir.' });
    }

    const docRef = doc(db, 'sites', 'test-sitesi');
    
    // Atomik olarak yeni anahtarı 'gemini_keys' dizisine ekle.
    // arrayUnion, anahtar zaten dizide varsa eklemez, bu da kopyaları önler.
    await updateDoc(docRef, {
      gemini_keys: arrayUnion(key.trim())
    });

    res.status(200).json({ message: 'Gemini API anahtarı başarıyla eklendi.' });

  } catch (error) {
    console.error('Gemini Anahtarı Ekleme API Hatası:', error);
    res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  }
}
