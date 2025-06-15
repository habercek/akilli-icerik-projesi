// pages/api/delete-gemini-key.js

import { db } from '../../firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

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
      return res.status(400).json({ error: 'Silinecek API anahtarı belirtilmelidir.' });
    }

    const docRef = doc(db, 'sites', 'test-sitesi');

    // Belirtilen anahtarı 'gemini_keys' dizisinden atomik olarak kaldır
    await updateDoc(docRef, {
      gemini_keys: arrayRemove(key.trim())
    });

    res.status(200).json({ message: 'Gemini API anahtarı başarıyla silindi.' });

  } catch (error) {
    console.error('Gemini Anahtarı Silme API Hatası:', error);
    res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  }
}
