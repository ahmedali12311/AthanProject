interface Dhikr {
  id: number;
  text: string;
  transliteration?: string;
  translation?: string;
  source?: string;
  repeat?: number;
}

interface Hadith {
  id: number;
  text: string;
  source: string;
  topic: string;
}

export const morningAdhkar: Dhikr[] = [
  {
    id: 1,
    text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    translation: "We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
    source: "صحيح مسلم",
    repeat: 1
  },
  {
    id: 2,
    text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Resurrection.",
    source: "أبو داود والترمذي",
    repeat: 1
  },
  {
    id: 3,
    text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلا أَنْتَ",
    translation: "O Allah, You are my Lord, there is none worthy of worship but You. You created me and I am your slave. I keep my covenant and my pledge to You as far as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sins, so forgive me, for there is none who can forgive sins except You.",
    source: "البخاري",
    repeat: 1
  },
  {
    id: 4,
    text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    translation: "Glory is to Allah and praise is to Him.",
    source: "صحيح مسلم",
    repeat: 100
  },
  {
    id: 5,
    text: "لا إلَهَ إلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    translation: "There is none worthy of worship but Allah alone, Who has no partner, His is the dominion and to Him belongs all praise, and He is able to do all things.",
    source: "البخاري ومسلم",
    repeat: 10
  }
];

export const eveningAdhkar: Dhikr[] = [
  {
    id: 1,
    text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    translation: "We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.",
    source: "صحيح مسلم",
    repeat: 1
  },
  {
    id: 2,
    text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    translation: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.",
    source: "أبو داود والترمذي",
    repeat: 1
  },
  {
    id: 3,
    text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    translation: "I seek refuge in the Perfect Words of Allah from the evil of what He has created.",
    source: "مسلم",
    repeat: 3
  },
  {
    id: 4,
    text: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
    translation: "O Allah, verily I have reached the evening and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner and that Muhammad is Your slave and Your Messenger.",
    source: "أبو داود",
    repeat: 4
  },
  {
    id: 5,
    text: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ، الْحَيُّ الْقَيُّومُ، وَأَتُوبُ إِلَيْهِ",
    translation: "I seek forgiveness from Allah, the Mighty, Whom there is none worthy of worship except Him, the Living, the Self-Subsisting, and I repent to Him.",
    source: "أبو داود والترمذي",
    repeat: 3
  }
];

export const prayerAdhkar: Dhikr[] = [
  {
    id: 1,
    text: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    translation: "Glory is to my Lord, the Most Great.",
    source: "أبو داود والترمذي",
    repeat: 3
  },
  {
    id: 2,
    text: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    translation: "Glory is to my Lord, the Most High.",
    source: "أبو داود والترمذي",
    repeat: 3
  },
  {
    id: 3,
    text: "رَبَّنَا وَلَكَ الْحَمْدُ، حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ",
    translation: "Our Lord, to You belongs all praise, an abundant, pure, and blessed praise.",
    source: "البخاري",
    repeat: 1
  },
  {
    id: 4,
    text: "اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَعَافِنِي، وَارْزُقْنِي",
    translation: "O Allah, forgive me, have mercy upon me, guide me, give me health and grant me sustenance.",
    source: "أبو داود والترمذي",
    repeat: 1
  },
  {
    id: 5,
    text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ",
    translation: "O Allah, I seek refuge in You from the punishment of Hell, from the punishment of the grave, from the trials of living and dying, and from the evil of the trial of the False Messiah.",
    source: "البخاري ومسلم",
    repeat: 1
  }
];

export const prayerHadiths: Hadith[] = [
  {
    id: 1,
    text: "عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: «أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسَ مَرَّاتٍ، هَلْ يَبْقَى مِنْ دَرَنِهِ شَيْءٌ؟» قَالُوا: لَا يَبْقَى مِنْ دَرَنِهِ شَيْءٌ. قَالَ: «فَذَلِكَ مِثْلُ الصَّلَوَاتِ الْخَمْسِ، يَمْحُو اللهُ بِهَا الْخَطَايَا»",
    source: "البخاري ومسلم",
    topic: "فضل الصلاة"
  },
  {
    id: 2,
    text: "عَنْ جَابِرِ بْنِ عَبْدِ اللهِ رَضِيَ اللهُ عَنْهُمَا أَنَّ رَسُولَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «مِفْتَاحُ الْجَنَّةِ الصَّلَاةُ»",
    source: "صحيح مسلم",
    topic: "فضل الصلاة"
  },
  {
    id: 3,
    text: "عَنْ أَنَسِ بْنِ مَالِكٍ رَضِيَ اللهُ عَنْهُ، قَالَ: قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: «حُبِّبَ إِلَيَّ مِنْ دُنْيَاكُمْ النِّسَاءُ وَالطِّيبُ، وَجُعِلَتْ قُرَّةُ عَيْنِي فِي الصَّلَاةِ»",
    source: "النسائي وأحمد",
    topic: "محبة الصلاة"
  },
  {
    id: 4,
    text: "عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «إِنَّ أَثْقَلَ صَلاَةٍ عَلَى الْمُنَافِقِينَ صَلاَةُ الْعِشَاءِ وَصَلاَةُ الْفَجْرِ، وَلَوْ يَعْلَمُونَ مَا فِيهِمَا لأَتَوْهُمَا وَلَوْ حَبْوًا»",
    source: "البخاري ومسلم",
    topic: "فضل صلاة الفجر والعشاء"
  },
  {
    id: 5,
    text: "عَنْ عُثْمَانَ بْنِ عَفَّانَ رَضِيَ اللهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: «مَنْ صَلَّى الْعِشَاءَ فِي جَمَاعَةٍ فَكَأَنَّمَا قَامَ نِصْفَ اللَّيْلِ، وَمَنْ صَلَّى الصُّبْحَ فِي جَمَاعَةٍ فَكَأَنَّمَا صَلَّى اللَّيْلَ كُلَّهُ»",
    source: "صحيح مسلم",
    topic: "فضل صلاة الجماعة"
  },
  {
    id: 6,
    text: "عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ: «الصَّلَوَاتُ الْخَمْسُ، وَالْجُمْعَةُ إِلَى الْجُمْعَةِ، وَرَمَضَانُ إِلَى رَمَضَانَ، مُكَفِّرَاتٌ مَا بَيْنَهُنَّ إِذَا اجْتَنَبَ الْكَبَائِرَ»",
    source: "صحيح مسلم",
    topic: "فضل الصلاة"
  },
  {
    id: 7,
    text: "عَنْ عَبْدِ اللهِ بْنِ مَسْعُودٍ رَضِيَ اللهُ عَنْهُ، قَالَ: سَأَلْتُ النَّبِيَّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللهِ؟ قَالَ: «الصَّلَاةُ عَلَى وَقْتِهَا» قُلْتُ: ثُمَّ أَيٌّ؟ قَالَ: «بِرُّ الْوَالِدَيْنِ» قُلْتُ: ثُمَّ أَيٌّ؟ قَالَ: «الْجِهَادُ فِي سَبِيلِ اللهِ»",
    source: "البخاري ومسلم",
    topic: "فضل الصلاة في وقتها"
  }
];

export const getRandomDhikr = (type: 'morning' | 'evening' | 'prayer'): Dhikr => {
  const collection = type === 'morning' 
    ? morningAdhkar 
    : type === 'evening' 
      ? eveningAdhkar 
      : prayerAdhkar;
  
  const randomIndex = Math.floor(Math.random() * collection.length);
  return collection[randomIndex];
};

export const getRandomHadith = (): Hadith => {
  const randomIndex = Math.floor(Math.random() * prayerHadiths.length);
  return prayerHadiths[randomIndex];
};

export const getCurrentAdhkarType = (): 'morning' | 'evening' => {
  const now = new Date();
  const hours = now.getHours();
  
  // Consider morning from 4am to 11:59am, evening from 12pm to 3:59am
  return (hours >= 4 && hours < 12) ? 'morning' : 'evening';
}; 