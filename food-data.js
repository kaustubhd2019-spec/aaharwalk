// Approximate calories per common home-style serving. Edit or add custom foods in the app for your kitchen.
window.BASE_FOODS = [
  {
    "id": "chapati",
    "name": "Chapati / Roti / Poli",
    "category": "Indian breads",
    "serving": "1 medium chapati/roti/poli",
    "calories": 90,
    "aliases": [
      "chapati",
      "roti",
      "phulka",
      "fulka",
      "poli",
      "पोळी",
      "चपाती",
      "रोटी",
      "फुलका",
      "फुल्का",
      "rotli",
      "roti poli"
    ]
  },
  {
    "id": "thin_phulka",
    "name": "Thin phulka",
    "category": "Indian breads",
    "serving": "1 small phulka",
    "calories": 65,
    "aliases": [
      "small phulka",
      "thin phulka",
      "छोटा फुलका",
      "छोटी रोटी",
      "small roti"
    ]
  },
  {
    "id": "ghee_roti",
    "name": "Ghee chapati",
    "category": "Indian breads",
    "serving": "1 medium chapati with ghee",
    "calories": 125,
    "aliases": [
      "ghee roti",
      "ghee chapati",
      "tup poli",
      "तूप पोळी",
      "घी रोटी",
      "ghee poli"
    ]
  },
  {
    "id": "paratha_plain",
    "name": "Plain paratha",
    "category": "Indian breads",
    "serving": "1 medium paratha",
    "calories": 180,
    "aliases": [
      "plain paratha",
      "paratha",
      "पराठा",
      "पराठा सादा",
      "sada paratha"
    ]
  },
  {
    "id": "aloo_paratha",
    "name": "Aloo paratha",
    "category": "Indian breads",
    "serving": "1 medium stuffed paratha",
    "calories": 280,
    "aliases": [
      "aloo paratha",
      "alu paratha",
      "आलू पराठा",
      "बटाटा पराठा",
      "batata paratha"
    ]
  },
  {
    "id": "methi_paratha",
    "name": "Methi paratha",
    "category": "Indian breads",
    "serving": "1 medium paratha",
    "calories": 210,
    "aliases": [
      "methi paratha",
      "मेथी पराठा"
    ]
  },
  {
    "id": "paneer_paratha",
    "name": "Paneer paratha",
    "category": "Indian breads",
    "serving": "1 medium stuffed paratha",
    "calories": 300,
    "aliases": [
      "paneer paratha",
      "पनीर पराठा"
    ]
  },
  {
    "id": "puri",
    "name": "Puri",
    "category": "Indian breads",
    "serving": "1 medium puri",
    "calories": 85,
    "aliases": [
      "puri",
      "poori",
      "पुरी"
    ]
  },
  {
    "id": "naan",
    "name": "Naan",
    "category": "Indian breads",
    "serving": "1 naan",
    "calories": 260,
    "aliases": [
      "naan",
      "नान"
    ]
  },
  {
    "id": "butter_naan",
    "name": "Butter naan",
    "category": "Indian breads",
    "serving": "1 butter naan",
    "calories": 330,
    "aliases": [
      "butter naan",
      "बटर नान",
      "makhan naan"
    ]
  },
  {
    "id": "rumali_roti",
    "name": "Rumali roti",
    "category": "Indian breads",
    "serving": "1 rumali roti",
    "calories": 160,
    "aliases": [
      "rumali roti",
      "रूमाली रोटी"
    ]
  },
  {
    "id": "missi_roti",
    "name": "Missi roti",
    "category": "Indian breads",
    "serving": "1 roti",
    "calories": 150,
    "aliases": [
      "missi roti",
      "misi roti",
      "मिस्सी रोटी"
    ]
  },
  {
    "id": "jowar_bhakri",
    "name": "Jowar bhakri",
    "category": "Indian breads",
    "serving": "1 medium bhakri",
    "calories": 125,
    "aliases": [
      "jowar bhakri",
      "jwari bhakri",
      "jowar roti",
      "ज्वारी भाकरी",
      "ज्वार भाकरी"
    ]
  },
  {
    "id": "bajra_bhakri",
    "name": "Bajra bhakri",
    "category": "Indian breads",
    "serving": "1 medium bhakri",
    "calories": 155,
    "aliases": [
      "bajra bhakri",
      "bajri bhakri",
      "bajra roti",
      "बाजरी भाकरी",
      "बाजरा रोटी"
    ]
  },
  {
    "id": "ragi_roti",
    "name": "Ragi roti / nachni bhakri",
    "category": "Indian breads",
    "serving": "1 medium roti/bhakri",
    "calories": 140,
    "aliases": [
      "ragi roti",
      "nachni bhakri",
      "nachni roti",
      "नाचणी भाकरी",
      "रागी रोटी"
    ]
  },
  {
    "id": "makki_roti",
    "name": "Makki roti",
    "category": "Indian breads",
    "serving": "1 medium roti",
    "calories": 180,
    "aliases": [
      "makki roti",
      "makke ki roti",
      "मक्की रोटी",
      "मकई रोटी"
    ]
  },
  {
    "id": "thepla",
    "name": "Thepla",
    "category": "Indian breads",
    "serving": "1 thepla",
    "calories": 130,
    "aliases": [
      "thepla",
      "थेपला",
      "methi thepla"
    ]
  },
  {
    "id": "thalipeeth",
    "name": "Thalipeeth",
    "category": "Indian breads",
    "serving": "1 medium thalipeeth",
    "calories": 220,
    "aliases": [
      "thalipeeth",
      "थालीपीठ"
    ]
  },
  {
    "id": "cooked_rice",
    "name": "Cooked rice / Bhat / Chawal",
    "category": "Rice dishes",
    "serving": "1 bowl cooked rice (about 150 g)",
    "calories": 195,
    "aliases": [
      "rice",
      "cooked rice",
      "white rice",
      "bhat",
      "bhaat",
      "chawal",
      "भात",
      "चावल",
      "भाताची वाटी",
      "सादा चावल"
    ]
  },
  {
    "id": "brown_rice",
    "name": "Brown rice",
    "category": "Rice dishes",
    "serving": "1 bowl cooked brown rice",
    "calories": 215,
    "aliases": [
      "brown rice",
      "ब्राउन राइस",
      "भूरा चावल"
    ]
  },
  {
    "id": "jeera_rice",
    "name": "Jeera rice",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 240,
    "aliases": [
      "jeera rice",
      "jira rice",
      "जीरा राइस",
      "जिरा भात",
      "cumin rice"
    ]
  },
  {
    "id": "lemon_rice",
    "name": "Lemon rice",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 280,
    "aliases": [
      "lemon rice",
      "nimbu rice",
      "लिंबू भात",
      "नींबू चावल"
    ]
  },
  {
    "id": "curd_rice",
    "name": "Curd rice",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 250,
    "aliases": [
      "curd rice",
      "dahi rice",
      "दही भात",
      "दही चावल"
    ]
  },
  {
    "id": "veg_pulao",
    "name": "Vegetable pulao",
    "category": "Rice dishes",
    "serving": "1 bowl/plate",
    "calories": 320,
    "aliases": [
      "veg pulao",
      "vegetable pulao",
      "pulao",
      "पुलाव",
      "वेज पुलाव"
    ]
  },
  {
    "id": "khichdi",
    "name": "Khichdi",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 250,
    "aliases": [
      "khichdi",
      "khichadi",
      "khichri",
      "खिचड़ी",
      "खिचडी",
      "moong dal khichdi",
      "मूग डाळ खिचडी"
    ]
  },
  {
    "id": "masala_khichdi",
    "name": "Masala khichdi",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 310,
    "aliases": [
      "masala khichdi",
      "masala khichadi",
      "मसाला खिचडी"
    ]
  },
  {
    "id": "pongal",
    "name": "Pongal",
    "category": "Rice dishes",
    "serving": "1 bowl",
    "calories": 300,
    "aliases": [
      "pongal",
      "ven pongal",
      "पोंगल"
    ]
  },
  {
    "id": "veg_biryani",
    "name": "Vegetable biryani",
    "category": "Rice dishes",
    "serving": "1 plate",
    "calories": 430,
    "aliases": [
      "veg biryani",
      "vegetable biryani",
      "वेज बिर्याणी",
      "वेज बिरयानी"
    ]
  },
  {
    "id": "egg_biryani",
    "name": "Egg biryani",
    "category": "Rice dishes",
    "serving": "1 plate",
    "calories": 520,
    "aliases": [
      "egg biryani",
      "anda biryani",
      "अंडा बिरयानी",
      "अंडा बिर्याणी"
    ]
  },
  {
    "id": "chicken_biryani",
    "name": "Chicken biryani",
    "category": "Rice dishes",
    "serving": "1 plate",
    "calories": 580,
    "aliases": [
      "chicken biryani",
      "चिकन बिरयानी",
      "चिकन बिर्याणी"
    ]
  },
  {
    "id": "mutton_biryani",
    "name": "Mutton biryani",
    "category": "Rice dishes",
    "serving": "1 plate",
    "calories": 680,
    "aliases": [
      "mutton biryani",
      "मटन बिरयानी",
      "मटण बिर्याणी"
    ]
  },
  {
    "id": "fried_rice_veg",
    "name": "Vegetable fried rice",
    "category": "Rice dishes",
    "serving": "1 bowl/plate",
    "calories": 360,
    "aliases": [
      "veg fried rice",
      "vegetable fried rice",
      "fried rice",
      "फ्राइड राइस",
      "फ्राइड राईस"
    ]
  },
  {
    "id": "plain_dal",
    "name": "Plain dal / Varan",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 160,
    "aliases": [
      "dal",
      "dahl",
      "daal",
      "plain dal",
      "varan",
      "वरण",
      "दाल",
      "डाळ",
      "sada dal",
      "simple dal"
    ]
  },
  {
    "id": "toor_dal",
    "name": "Toor / Arhar dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 180,
    "aliases": [
      "toor dal",
      "tuvar dal",
      "arhar dal",
      "तूर डाळ",
      "अरहर दाल",
      "तुवर डाळ",
      "tur dal"
    ]
  },
  {
    "id": "moong_dal",
    "name": "Moong dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 160,
    "aliases": [
      "moong dal",
      "mung dal",
      "yellow moong",
      "मूंग दाल",
      "मूग डाळ",
      "पिवळी मूग डाळ"
    ]
  },
  {
    "id": "green_moong",
    "name": "Green moong curry",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 210,
    "aliases": [
      "green moong",
      "whole moong",
      "hirva moog",
      "हिरवा मूग",
      "हरी मूंग",
      "moong usal"
    ]
  },
  {
    "id": "masoor_dal",
    "name": "Masoor dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 170,
    "aliases": [
      "masoor dal",
      "red lentil dal",
      "मसूर दाल",
      "मसूर डाळ"
    ]
  },
  {
    "id": "chana_dal",
    "name": "Chana dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 220,
    "aliases": [
      "chana dal",
      "चना दाल",
      "हरभरा डाळ",
      "split chickpea dal"
    ]
  },
  {
    "id": "urad_dal",
    "name": "Urad dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 220,
    "aliases": [
      "urad dal",
      "udad dal",
      "उड़द दाल",
      "उडीद डाळ",
      "black gram dal"
    ]
  },
  {
    "id": "mixed_dal",
    "name": "Mixed dal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 190,
    "aliases": [
      "mixed dal",
      "mix dal",
      "पंचमेल दाल",
      "panchmel dal",
      "panchratna dal"
    ]
  },
  {
    "id": "dal_fry",
    "name": "Dal fry",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 230,
    "aliases": [
      "dal fry",
      "दाल फ्राई",
      "डाळ फ्राय"
    ]
  },
  {
    "id": "dal_tadka",
    "name": "Dal tadka",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 250,
    "aliases": [
      "dal tadka",
      "tadka dal",
      "दाल तड़का",
      "डाळ तडका"
    ]
  },
  {
    "id": "dal_makhani",
    "name": "Dal makhani",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 330,
    "aliases": [
      "dal makhani",
      "दाल मखनी"
    ]
  },
  {
    "id": "dal_palak",
    "name": "Dal palak",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 210,
    "aliases": [
      "dal palak",
      "पालक दाल",
      "पालक डाळ"
    ]
  },
  {
    "id": "amti",
    "name": "Amti",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 170,
    "aliases": [
      "amti",
      "aamti",
      "आमटी",
      "maharashtrian dal"
    ]
  },
  {
    "id": "sambar",
    "name": "Sambar",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 150,
    "aliases": [
      "sambar",
      "sambhar",
      "सांभर",
      "सांबार"
    ]
  },
  {
    "id": "kadhi",
    "name": "Kadhi",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 180,
    "aliases": [
      "kadhi",
      "कढ़ी",
      "कढी",
      "takachi kadhi",
      "दही कढ़ी"
    ]
  },
  {
    "id": "rajma",
    "name": "Rajma curry",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 260,
    "aliases": [
      "rajma",
      "rajma curry",
      "राजमा"
    ]
  },
  {
    "id": "chole",
    "name": "Chole / Chana masala",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 280,
    "aliases": [
      "chole",
      "chana masala",
      "chane",
      "चना मसाला",
      "छोले",
      "चणे",
      "काबुली चणे"
    ]
  },
  {
    "id": "black_chana",
    "name": "Black chana curry",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 240,
    "aliases": [
      "black chana",
      "kala chana",
      "काला चना",
      "काळे चणे"
    ]
  },
  {
    "id": "lobia",
    "name": "Lobia curry",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 230,
    "aliases": [
      "lobia",
      "chawli",
      "black eyed peas",
      "लोबिया",
      "चवळी"
    ]
  },
  {
    "id": "matki_usal",
    "name": "Matki usal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 230,
    "aliases": [
      "matki usal",
      "मटकी उसळ",
      "matki",
      "moth beans"
    ]
  },
  {
    "id": "sprouts_usal",
    "name": "Sprouts usal",
    "category": "Dals & legumes",
    "serving": "1 bowl",
    "calories": 210,
    "aliases": [
      "sprouts usal",
      "mixed sprouts",
      "sprout curry",
      "अंकुरित उसळ",
      "sprouts bhaji"
    ]
  },
  {
    "id": "misal",
    "name": "Misal",
    "category": "Dals & legumes",
    "serving": "1 bowl misal without pav",
    "calories": 300,
    "aliases": [
      "misal",
      "मिसळ",
      "misal curry"
    ]
  },
  {
    "id": "mixed_sabzi",
    "name": "Mixed vegetable sabzi / Bhaji",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 160,
    "aliases": [
      "sabzi",
      "subzi",
      "sabji",
      "bhaji",
      "vegetable sabzi",
      "mixed sabzi",
      "मिश्र भाजी",
      "भाजी",
      "सब्जी",
      "मिश्र सब्जी"
    ]
  },
  {
    "id": "aloo_sabzi",
    "name": "Aloo sabzi / Batata bhaji",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 220,
    "aliases": [
      "aloo sabzi",
      "potato sabzi",
      "batata bhaji",
      "बटाटा भाजी",
      "आलू सब्जी",
      "batata chi bhaji"
    ]
  },
  {
    "id": "bhindi_sabzi",
    "name": "Bhindi / Bhendi sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 160,
    "aliases": [
      "bhindi",
      "bhindi sabzi",
      "okra sabzi",
      "bhendi bhaji",
      "भेंडी",
      "भिंडी",
      "भेंडी भाजी"
    ]
  },
  {
    "id": "aloo_gobi",
    "name": "Aloo gobi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 210,
    "aliases": [
      "aloo gobi",
      "alu gobhi",
      "आलू गोभी",
      "फ्लॉवर बटाटा"
    ]
  },
  {
    "id": "gobi_sabzi",
    "name": "Cauliflower / Gobi sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 140,
    "aliases": [
      "gobi sabzi",
      "cauliflower sabzi",
      "gobhi",
      "flower bhaji",
      "फ्लॉवर भाजी",
      "गोभी सब्जी"
    ]
  },
  {
    "id": "cabbage_sabzi",
    "name": "Cabbage / Kobi sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 120,
    "aliases": [
      "cabbage sabzi",
      "kobi bhaji",
      "patta gobi",
      "पत्ता गोभी",
      "कोबी भाजी",
      "cabbage bhaji"
    ]
  },
  {
    "id": "beans_sabzi",
    "name": "Green beans sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 130,
    "aliases": [
      "beans sabzi",
      "farasbi bhaji",
      "green beans",
      "फरसबी भाजी",
      "बीन्स सब्जी"
    ]
  },
  {
    "id": "carrot_beans_sabzi",
    "name": "Carrot beans sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 140,
    "aliases": [
      "carrot beans sabzi",
      "gajar beans",
      "गाजर बीन्स"
    ]
  },
  {
    "id": "palak_paneer",
    "name": "Palak paneer",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 300,
    "aliases": [
      "palak paneer",
      "पालक पनीर"
    ]
  },
  {
    "id": "matar_paneer",
    "name": "Matar paneer",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 330,
    "aliases": [
      "matar paneer",
      "मटर पनीर",
      "वाटाणा पनीर"
    ]
  },
  {
    "id": "paneer_bhurji",
    "name": "Paneer bhurji",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 350,
    "aliases": [
      "paneer bhurji",
      "पनीर भुर्जी"
    ]
  },
  {
    "id": "paneer_masala",
    "name": "Paneer masala",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 360,
    "aliases": [
      "paneer masala",
      "paneer curry",
      "पनीर मसाला"
    ]
  },
  {
    "id": "methi_sabzi",
    "name": "Methi sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 130,
    "aliases": [
      "methi sabzi",
      "methi bhaji",
      "मेथी भाजी",
      "मेथी सब्जी"
    ]
  },
  {
    "id": "palak_sabzi",
    "name": "Palak sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 120,
    "aliases": [
      "palak sabzi",
      "palak bhaji",
      "spinach sabzi",
      "पालक भाजी",
      "पालक सब्जी"
    ]
  },
  {
    "id": "baingan_bharta",
    "name": "Baingan bharta / Vangyache bharit",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 180,
    "aliases": [
      "baingan bharta",
      "baingan bhurta",
      "vangyache bharit",
      "बैंगन भरता",
      "वांग्याचे भरीत",
      "वांगी भरीत"
    ]
  },
  {
    "id": "baingan_masala",
    "name": "Baingan masala / Vangi bhaji",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 190,
    "aliases": [
      "baingan masala",
      "vangi bhaji",
      "brinjal sabzi",
      "बैंगन मसाला",
      "वांगी भाजी"
    ]
  },
  {
    "id": "lauki_sabzi",
    "name": "Lauki / Dudhi sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 100,
    "aliases": [
      "lauki sabzi",
      "dudhi bhaji",
      "bottle gourd",
      "लौकी सब्जी",
      "दुधी भाजी",
      "दूधी भोपळा"
    ]
  },
  {
    "id": "turai_sabzi",
    "name": "Turai / Dodka sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 100,
    "aliases": [
      "turai sabzi",
      "tori sabzi",
      "dodka bhaji",
      "ridge gourd",
      "तुरई सब्जी",
      "दोडका भाजी"
    ]
  },
  {
    "id": "tinda_sabzi",
    "name": "Tinda sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 110,
    "aliases": [
      "tinda sabzi",
      "टिंडा सब्जी",
      "tinde"
    ]
  },
  {
    "id": "karela_sabzi",
    "name": "Karela / Karle sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 120,
    "aliases": [
      "karela sabzi",
      "karle bhaji",
      "bitter gourd",
      "करेला सब्जी",
      "कारले भाजी"
    ]
  },
  {
    "id": "pumpkin_sabzi",
    "name": "Pumpkin / Kaddu sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 130,
    "aliases": [
      "pumpkin sabzi",
      "kaddu sabzi",
      "bhopla bhaji",
      "कद्दू सब्जी",
      "भोपळा भाजी"
    ]
  },
  {
    "id": "capsicum_sabzi",
    "name": "Capsicum sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 140,
    "aliases": [
      "capsicum sabzi",
      "shimla mirch",
      "ढोबळी मिरची",
      "शिमला मिर्च"
    ]
  },
  {
    "id": "mushroom_masala",
    "name": "Mushroom masala",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 200,
    "aliases": [
      "mushroom masala",
      "mushroom sabzi",
      "मशरूम मसाला"
    ]
  },
  {
    "id": "peas_sabzi",
    "name": "Green peas / Matar sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 180,
    "aliases": [
      "matar sabzi",
      "green peas sabzi",
      "vatana bhaji",
      "मटर सब्जी",
      "वाटाणा भाजी"
    ]
  },
  {
    "id": "beetroot_sabzi",
    "name": "Beetroot sabzi",
    "category": "Sabzi & vegetables",
    "serving": "1 bowl",
    "calories": 130,
    "aliases": [
      "beetroot sabzi",
      "beet bhaji",
      "चुकंदर सब्जी",
      "बीट भाजी"
    ]
  },
  {
    "id": "green_salad",
    "name": "Green salad",
    "category": "Salads",
    "serving": "1 plate/bowl",
    "calories": 35,
    "aliases": [
      "green salad",
      "salad",
      "सलाद",
      "हिरवे सलाड"
    ]
  },
  {
    "id": "kachumber",
    "name": "Kachumber salad",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 50,
    "aliases": [
      "kachumber",
      "kachumbar",
      "कचुंबर",
      "कचुम्बर",
      "onion tomato cucumber salad"
    ]
  },
  {
    "id": "cucumber_salad",
    "name": "Cucumber salad / Kakdi",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 30,
    "aliases": [
      "cucumber salad",
      "kakdi",
      "खीरा",
      "काकडी",
      "cucumber"
    ]
  },
  {
    "id": "carrot_salad",
    "name": "Carrot salad / Gajar",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 60,
    "aliases": [
      "carrot salad",
      "gajar salad",
      "गाजर सलाद",
      "carrot",
      "गाजर"
    ]
  },
  {
    "id": "onion_salad",
    "name": "Onion salad",
    "category": "Salads",
    "serving": "1 small plate",
    "calories": 45,
    "aliases": [
      "onion salad",
      "pyaz salad",
      "कांदा",
      "प्याज सलाद",
      "onion"
    ]
  },
  {
    "id": "tomato_salad",
    "name": "Tomato salad",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 35,
    "aliases": [
      "tomato salad",
      "tamatar salad",
      "टोमॅटो",
      "टमाटर सलाद",
      "tomato"
    ]
  },
  {
    "id": "sprouts_salad",
    "name": "Sprouts salad",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 140,
    "aliases": [
      "sprouts salad",
      "moong sprouts salad",
      "अंकुरित सलाद",
      "मूग स्प्राउट्स"
    ]
  },
  {
    "id": "raita",
    "name": "Raita",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 120,
    "aliases": [
      "raita",
      "रायता",
      "काकडी रायता",
      "boondi raita"
    ]
  },
  {
    "id": "fruit_salad",
    "name": "Fruit salad",
    "category": "Salads",
    "serving": "1 bowl",
    "calories": 120,
    "aliases": [
      "fruit salad",
      "फ्रूट सलाद",
      "फळ सलाड",
      "mixed fruit"
    ]
  },
  {
    "id": "banana",
    "name": "Banana / Kela",
    "category": "Fruits",
    "serving": "1 medium banana",
    "calories": 105,
    "aliases": [
      "banana",
      "kela",
      "केला",
      "केळे"
    ]
  },
  {
    "id": "apple",
    "name": "Apple",
    "category": "Fruits",
    "serving": "1 medium apple",
    "calories": 95,
    "aliases": [
      "apple",
      "seb",
      "safarchand",
      "सेब",
      "सफरचंद"
    ]
  },
  {
    "id": "mango",
    "name": "Mango / Aam / Amba",
    "category": "Fruits",
    "serving": "1 medium mango",
    "calories": 150,
    "aliases": [
      "mango",
      "aam",
      "amba",
      "आम",
      "आंबा"
    ]
  },
  {
    "id": "orange",
    "name": "Orange / Santra",
    "category": "Fruits",
    "serving": "1 medium orange",
    "calories": 60,
    "aliases": [
      "orange",
      "santra",
      "narangi",
      "संत्रा",
      "नारंगी"
    ]
  },
  {
    "id": "sweet_lime",
    "name": "Sweet lime / Mosambi",
    "category": "Fruits",
    "serving": "1 medium mosambi",
    "calories": 65,
    "aliases": [
      "sweet lime",
      "mosambi",
      "मोसंबी",
      "मौसंबी"
    ]
  },
  {
    "id": "guava",
    "name": "Guava / Peru / Amrud",
    "category": "Fruits",
    "serving": "1 medium guava",
    "calories": 70,
    "aliases": [
      "guava",
      "peru",
      "amrud",
      "अमरूद",
      "अमरुद",
      "पेरू"
    ]
  },
  {
    "id": "papaya",
    "name": "Papaya",
    "category": "Fruits",
    "serving": "1 bowl diced papaya",
    "calories": 60,
    "aliases": [
      "papaya",
      "papita",
      "papai",
      "पपीता",
      "पपई"
    ]
  },
  {
    "id": "watermelon",
    "name": "Watermelon",
    "category": "Fruits",
    "serving": "1 bowl diced watermelon",
    "calories": 45,
    "aliases": [
      "watermelon",
      "tarbooj",
      "kalingad",
      "तरबूज",
      "कलिंगड"
    ]
  },
  {
    "id": "muskmelon",
    "name": "Muskmelon",
    "category": "Fruits",
    "serving": "1 bowl diced muskmelon",
    "calories": 55,
    "aliases": [
      "muskmelon",
      "kharbooja",
      "खरबूजा",
      "खरबूज"
    ]
  },
  {
    "id": "grapes",
    "name": "Grapes",
    "category": "Fruits",
    "serving": "1 bowl grapes",
    "calories": 70,
    "aliases": [
      "grapes",
      "angoor",
      "draksha",
      "अंगूर",
      "द्राक्षे",
      "द्राक्ष"
    ]
  },
  {
    "id": "pomegranate",
    "name": "Pomegranate",
    "category": "Fruits",
    "serving": "1 small bowl arils",
    "calories": 85,
    "aliases": [
      "pomegranate",
      "anar",
      "dalimb",
      "अनार",
      "डाळिंब"
    ]
  },
  {
    "id": "chikoo",
    "name": "Chikoo / Sapota",
    "category": "Fruits",
    "serving": "1 medium chikoo",
    "calories": 140,
    "aliases": [
      "chikoo",
      "chiku",
      "sapota",
      "चीकू",
      "चिकू"
    ]
  },
  {
    "id": "custard_apple",
    "name": "Custard apple / Sitaphal",
    "category": "Fruits",
    "serving": "1 small fruit",
    "calories": 140,
    "aliases": [
      "custard apple",
      "sitaphal",
      "सीताफल",
      "sitafal"
    ]
  },
  {
    "id": "pineapple",
    "name": "Pineapple",
    "category": "Fruits",
    "serving": "1 bowl pieces",
    "calories": 80,
    "aliases": [
      "pineapple",
      "ananas",
      "अनानास"
    ]
  },
  {
    "id": "pear",
    "name": "Pear",
    "category": "Fruits",
    "serving": "1 medium pear",
    "calories": 100,
    "aliases": [
      "pear",
      "nashpati",
      "नाशपाती"
    ]
  },
  {
    "id": "strawberry",
    "name": "Strawberries",
    "category": "Fruits",
    "serving": "1 bowl",
    "calories": 50,
    "aliases": [
      "strawberry",
      "strawberries",
      "स्ट्रॉबेरी"
    ]
  },
  {
    "id": "dates",
    "name": "Dates / Khajur",
    "category": "Fruits",
    "serving": "2 dates",
    "calories": 130,
    "aliases": [
      "dates",
      "khajur",
      "खजूर",
      "khajoor"
    ]
  },
  {
    "id": "coconut_water",
    "name": "Coconut water",
    "category": "Fruits",
    "serving": "1 glass/tender coconut",
    "calories": 45,
    "aliases": [
      "coconut water",
      "nariyal pani",
      "नारियल पानी",
      "शहाळे पाणी"
    ]
  },
  {
    "id": "poha",
    "name": "Poha",
    "category": "Breakfast & snacks",
    "serving": "1 plate/bowl",
    "calories": 250,
    "aliases": [
      "poha",
      "pohe",
      "पोहा",
      "पोहे",
      "kanda poha"
    ]
  },
  {
    "id": "upma",
    "name": "Upma",
    "category": "Breakfast & snacks",
    "serving": "1 plate/bowl",
    "calories": 260,
    "aliases": [
      "upma",
      "उपमा"
    ]
  },
  {
    "id": "sabudana_khichdi",
    "name": "Sabudana khichdi",
    "category": "Breakfast & snacks",
    "serving": "1 plate/bowl",
    "calories": 400,
    "aliases": [
      "sabudana khichdi",
      "sago khichdi",
      "साबुदाणा खिचडी",
      "साबूदाना खिचड़ी"
    ]
  },
  {
    "id": "idli",
    "name": "Idli",
    "category": "Breakfast & snacks",
    "serving": "1 idli",
    "calories": 60,
    "aliases": [
      "idli",
      "इडली"
    ]
  },
  {
    "id": "dosa_plain",
    "name": "Plain dosa",
    "category": "Breakfast & snacks",
    "serving": "1 dosa",
    "calories": 170,
    "aliases": [
      "dosa",
      "plain dosa",
      "डोसा",
      "सादा डोसा"
    ]
  },
  {
    "id": "masala_dosa",
    "name": "Masala dosa",
    "category": "Breakfast & snacks",
    "serving": "1 dosa",
    "calories": 330,
    "aliases": [
      "masala dosa",
      "मसाला डोसा"
    ]
  },
  {
    "id": "uttapam",
    "name": "Uttapam",
    "category": "Breakfast & snacks",
    "serving": "1 uttapam",
    "calories": 270,
    "aliases": [
      "uttapam",
      "uttappa",
      "उत्तपम",
      "उत्तप्पा"
    ]
  },
  {
    "id": "medu_vada",
    "name": "Medu vada",
    "category": "Breakfast & snacks",
    "serving": "1 vada",
    "calories": 110,
    "aliases": [
      "medu vada",
      "vada",
      "मेदू वडा",
      "वडा"
    ]
  },
  {
    "id": "vada_pav",
    "name": "Vada pav",
    "category": "Breakfast & snacks",
    "serving": "1 vada pav",
    "calories": 320,
    "aliases": [
      "vada pav",
      "वडा पाव"
    ]
  },
  {
    "id": "pav_bhaji",
    "name": "Pav bhaji",
    "category": "Breakfast & snacks",
    "serving": "1 plate with 2 pav",
    "calories": 430,
    "aliases": [
      "pav bhaji",
      "पाव भाजी"
    ]
  },
  {
    "id": "misal_pav",
    "name": "Misal pav",
    "category": "Breakfast & snacks",
    "serving": "1 plate with pav",
    "calories": 500,
    "aliases": [
      "misal pav",
      "मिसळ पाव"
    ]
  },
  {
    "id": "samosa",
    "name": "Samosa",
    "category": "Breakfast & snacks",
    "serving": "1 piece",
    "calories": 260,
    "aliases": [
      "samosa",
      "समोसा"
    ]
  },
  {
    "id": "kachori",
    "name": "Kachori",
    "category": "Breakfast & snacks",
    "serving": "1 piece",
    "calories": 280,
    "aliases": [
      "kachori",
      "कचोरी"
    ]
  },
  {
    "id": "dhokla",
    "name": "Dhokla",
    "category": "Breakfast & snacks",
    "serving": "1 plate / 4 pieces",
    "calories": 180,
    "aliases": [
      "dhokla",
      "ढोकला"
    ]
  },
  {
    "id": "khandvi",
    "name": "Khandvi",
    "category": "Breakfast & snacks",
    "serving": "1 plate",
    "calories": 160,
    "aliases": [
      "khandvi",
      "खांडवी"
    ]
  },
  {
    "id": "pakora",
    "name": "Pakora / Bhajiya",
    "category": "Breakfast & snacks",
    "serving": "1 plate small",
    "calories": 300,
    "aliases": [
      "pakora",
      "pakoda",
      "bhajiya",
      "भजिया",
      "पकोड़ा",
      "भजी"
    ]
  },
  {
    "id": "bread_slice",
    "name": "Bread slice",
    "category": "Breakfast & snacks",
    "serving": "1 slice",
    "calories": 75,
    "aliases": [
      "bread",
      "bread slice",
      "ब्रेड"
    ]
  },
  {
    "id": "egg_boiled",
    "name": "Boiled egg",
    "category": "Breakfast & snacks",
    "serving": "1 egg",
    "calories": 78,
    "aliases": [
      "boiled egg",
      "egg",
      "anda",
      "अंडा",
      "उकडलेले अंडे",
      "उबला अंडा"
    ]
  },
  {
    "id": "curd",
    "name": "Curd / Dahi",
    "category": "Dairy & drinks",
    "serving": "1 bowl",
    "calories": 100,
    "aliases": [
      "curd",
      "dahi",
      "दही"
    ]
  },
  {
    "id": "milk",
    "name": "Milk",
    "category": "Dairy & drinks",
    "serving": "1 glass",
    "calories": 150,
    "aliases": [
      "milk",
      "doodh",
      "दूध"
    ]
  },
  {
    "id": "buttermilk",
    "name": "Buttermilk / Chaas / Tak",
    "category": "Dairy & drinks",
    "serving": "1 glass",
    "calories": 40,
    "aliases": [
      "buttermilk",
      "chaas",
      "chhachh",
      "tak",
      "छाछ",
      "ताक"
    ]
  },
  {
    "id": "tea_milk_sugar",
    "name": "Milk tea with sugar",
    "category": "Dairy & drinks",
    "serving": "1 cup",
    "calories": 80,
    "aliases": [
      "tea",
      "chai",
      "milk tea",
      "चहा",
      "चाय",
      "कटिंग चाय"
    ]
  },
  {
    "id": "coffee_milk_sugar",
    "name": "Coffee with milk and sugar",
    "category": "Dairy & drinks",
    "serving": "1 cup",
    "calories": 90,
    "aliases": [
      "coffee",
      "कॉफी",
      "milk coffee"
    ]
  },
  {
    "id": "lassi_sweet",
    "name": "Sweet lassi",
    "category": "Dairy & drinks",
    "serving": "1 glass",
    "calories": 220,
    "aliases": [
      "lassi",
      "sweet lassi",
      "लस्सी"
    ]
  },
  {
    "id": "paneer",
    "name": "Paneer",
    "category": "Dairy & drinks",
    "serving": "1 small bowl / 100 g",
    "calories": 300,
    "aliases": [
      "paneer",
      "पनीर"
    ]
  },
  {
    "id": "gulab_jamun",
    "name": "Gulab jamun",
    "category": "Sweets",
    "serving": "1 piece",
    "calories": 150,
    "aliases": [
      "gulab jamun",
      "गुलाब जामुन"
    ]
  },
  {
    "id": "jalebi",
    "name": "Jalebi",
    "category": "Sweets",
    "serving": "1 medium piece",
    "calories": 150,
    "aliases": [
      "jalebi",
      "जलेबी"
    ]
  },
  {
    "id": "kheer",
    "name": "Kheer",
    "category": "Sweets",
    "serving": "1 bowl",
    "calories": 250,
    "aliases": [
      "kheer",
      "payasam",
      "खीर",
      "पायसम"
    ]
  },
  {
    "id": "shrikhand",
    "name": "Shrikhand",
    "category": "Sweets",
    "serving": "1 small bowl",
    "calories": 250,
    "aliases": [
      "shrikhand",
      "श्रीखंड"
    ]
  },
  {
    "id": "modak",
    "name": "Modak",
    "category": "Sweets",
    "serving": "1 piece",
    "calories": 125,
    "aliases": [
      "modak",
      "मोदक"
    ]
  }
];
