// pages/api/delete-gemini-key.js

import { db } from '../../firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({ error: 'Silinecek API anahtarı belirtilmelidir.' });
    }

    const docRef = doc(db, 'sites', 'test-sitesi');

    // Atomik olarak belirtilen anahtarı 'gemini_keys' dizisinden kaldır.
    await updateDoc(docRef, {
      gemini_keys: arrayRemove(key.trim())
    });

    res.status(200).json({ message: 'Gemini API anahtarı başarıyla silindi.' });

  } catch (error) {
    console.error('Gemini Anahtarı Silme API Hatası:', error);
    res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  }
}
