/* AaharWalk — food database.
 *
 * Every row is ONE default home-style serving. Values are approximate and
 * come from common Indian food-composition references and typical home recipes.
 * They are estimates, not lab measurements — the app always presents them as "≈".
 *
 * Row format:
 * [id, name, marathiName, category, cuisine, unit, grams, kcal, protein, carbs, fat, fibre, addedOilG, diet, heart, aliases]
 *
 *  unit    default serving unit key (see units.js)
 *  grams   weight of that one default serving
 *  addedOilG  cooking oil/ghee already included in the numbers above. The oil
 *             slider scales this, so "less oil" actually changes the calories.
 *  diet    1 = vegetarian, 2 = contains egg, 3 = non-vegetarian
 *  heart   1 (save for occasions) … 5 (generally heart-friendly), used for ranking suggestions
 *
 * Note: for the alcoholic drinks, kcal deliberately exceeds protein+carbs+fat,
 * because alcohol itself carries about 7 kcal per gram.
 *  aliases pipe-separated; English, transliterated Marathi/Hindi and Devanagari
 */

const VEG = 1, EGG = 2, NONVEG = 3;

const ROWS = [
// ——— Breads / bhakri / poli ———————————————————————————————————————————
["chapati","Chapati / Poli","पोळी","bread","mh","piece",45,90,3,18,0.7,2.5,0,VEG,4,"chapati|chapathi|roti|rotli|phulka|fulka|poli|pholi|चपाती|पोळी|रोटी|फुलका|poli chapati"],
["phulka_small","Thin phulka","पातळ फुलका","bread","north","piece",32,65,2.2,13,0.4,1.8,0,VEG,5,"thin phulka|small roti|patal poli|छोटी पोळी|पातळ पोळी|small chapati"],
["ghee_poli","Ghee poli","तूप पोळी","bread","mh","piece",48,125,3,18,4.7,2.5,4,VEG,3,"ghee roti|ghee chapati|tup poli|तूप पोळी|घी रोटी|ghee poli"],
["jowar_bhakri","Jowar Bhakri","ज्वारीची भाकरी","bread","mh","piece",60,130,3.4,27,1,3.6,0,VEG,5,"bhakri|bhakari|bhakhri|jowar bhakri|jwari bhakri|jwarichi bhakri|भाकरी|ज्वारीची भाकरी|ज्वारी भाकरी|भाकरि"],
["bajra_bhakri","Bajra Bhakri","बाजरीची भाकरी","bread","mh","piece",60,155,4.2,29,2.5,4.2,0,VEG,5,"bajra bhakri|bajri bhakri|bajrichi bhakri|बाजरीची भाकरी|बाजरी भाकरी"],
["nachni_bhakri","Nachni Bhakri","नाचणीची भाकरी","bread","mh","piece",60,135,3.2,29,1.1,3.8,0,VEG,5,"nachni bhakri|ragi roti|ragi bhakri|nachnichi bhakri|नाचणीची भाकरी|नाचणी भाकरी|रागी रोटी"],
["tandul_bhakri","Rice Bhakri","तांदळाची भाकरी","bread","mh","piece",60,140,2.4,31,0.5,1,0,VEG,4,"rice bhakri|tandulachi bhakri|तांदळाची भाकरी|tandul bhakri"],
["thalipeeth","Thalipeeth","थालीपीठ","bread","mh","piece",80,220,6,32,7,4.5,5,VEG,4,"thalipeeth|thalipith|थालीपीठ|thalipeet"],
["puran_poli","Puran Poli","पुरणपोळी","sweet","mh","piece",90,300,6,52,7.5,3.5,5,VEG,2,"puran poli|puranpoli|पुरणपोळी|पुरण पोळी"],
["paratha_plain","Plain Paratha","पराठा","bread","north","piece",70,180,4,26,6.5,3,5,VEG,3,"paratha|parantha|plain paratha|पराठा|सादा पराठा"],
["aloo_paratha","Aloo Paratha","बटाटा पराठा","bread","punj","piece",110,280,6,42,9.5,4,7,VEG,2,"aloo paratha|alu paratha|batata paratha|आलू पराठा|बटाटा पराठा"],
["methi_paratha","Methi Paratha","मेथी पराठा","bread","north","piece",75,210,5.5,29,7.5,4,5,VEG,3,"methi paratha|मेथी पराठा"],
["paneer_paratha","Paneer Paratha","पनीर पराठा","bread","punj","piece",120,300,11,36,12,3.5,7,VEG,3,"paneer paratha|पनीर पराठा"],
["puri","Puri","पुरी","bread","north","piece",25,85,1.8,10,4.2,1,4,VEG,2,"puri|poori|पुरी|puri bhaji puri"],
["naan","Naan","नान","bread","punj","piece",90,260,8,45,5,2,0,VEG,2,"naan|नान|plain naan"],
["butter_naan","Butter Naan","बटर नान","bread","punj","piece",95,330,8,45,12,2,7,VEG,1,"butter naan|बटर नान"],
["missi_roti","Missi Roti","मिस्सी रोटी","bread","raj","piece",60,150,5,22,4.5,3.5,3,VEG,4,"missi roti|मिस्सी रोटी"],
["makki_roti","Makki Roti","मक्याची भाकरी","bread","punj","piece",70,180,4,30,5,3.5,3,VEG,4,"makki roti|makki di roti|मक्याची भाकरी|मक्की रोटी"],
["thepla","Thepla","थेपला","bread","guj","piece",45,130,3.2,18,5,2.6,4,VEG,3,"thepla|theplas|थेपला"],
["rumali_roti","Rumali Roti","रुमाली रोटी","bread","north","piece",55,160,4.5,30,2.5,1.2,0,VEG,2,"rumali roti|रुमाली रोटी"],
["bread_slice","Bread slice","ब्रेड स्लाईस","bread","generic","slice",28,75,2.5,14,1,0.8,0,VEG,2,"bread|bread slice|white bread|पाव ब्रेड|ब्रेड"],
["brown_bread_slice","Brown bread slice","ब्राऊन ब्रेड","bread","generic","slice",30,70,3,13,1,2,0,VEG,3,"brown bread|whole wheat bread|multigrain bread|ब्राऊन ब्रेड"],
["pav","Pav","पाव","bread","mh","piece",45,130,4,25,1.5,1,0,VEG,2,"pav|ladi pav|पाव|bun pav"],

// ——— Rice dishes ————————————————————————————————————————————————————
["cooked_rice","Cooked Rice / Bhat","भात","rice","generic","bowl",150,195,4,43,0.4,0.9,0,VEG,3,"rice|bhat|bhaat|chawal|cooked rice|white rice|भात|चावल|तांदूळ भात|plain rice"],
["brown_rice","Brown Rice","ब्राऊन भात","rice","generic","bowl",150,215,5,45,1.7,3.2,0,VEG,4,"brown rice|ब्राऊन राईस|brown bhat"],
["jeera_rice","Jeera Rice","जिरा भात","rice","north","bowl",150,240,4.2,43,6,1,5,VEG,3,"jeera rice|jira rice|जिरा राईस|जिरा भात"],
["lemon_rice","Lemon Rice","लिंबू भात","rice","south","bowl",180,280,5,48,8,2,6,VEG,3,"lemon rice|chitranna|लिंबू भात"],
["curd_rice","Curd Rice","दही भात","rice","south","bowl",200,250,7,40,6,1,3,VEG,3,"curd rice|dahi bhat|thayir sadam|दही भात"],
["veg_pulao","Vegetable Pulao","भाज्यांचा पुलाव","rice","north","bowl",200,320,6.5,52,9.5,3.5,8,VEG,3,"pulao|pulav|veg pulao|vegetable pulao|पुलाव|भाजी पुलाव"],
["khichdi","Khichdi","खिचडी","rice","generic","bowl",200,250,9,42,5,4,4,VEG,5,"khichdi|khichadi|khichri|खिचडी|dal khichdi|moong khichdi"],
["masala_khichdi","Masala Khichdi","मसाले खिचडी","rice","mh","bowl",220,310,10,48,8,5,6,VEG,4,"masala khichdi|veg khichdi|मसाले खिचडी"],
["pongal","Pongal","पोंगल","rice","south","bowl",200,300,9,46,9,3,7,VEG,3,"pongal|ven pongal|पोंगल"],
["veg_biryani","Vegetable Biryani","भाजी बिर्याणी","rice","north","plate",250,430,9,68,13,4.5,11,VEG,2,"veg biryani|vegetable biryani|भाजी बिर्याणी|biryani veg"],
["chicken_biryani","Chicken Biryani","चिकन बिर्याणी","rice","north","plate",300,580,28,70,20,3.5,12,NONVEG,2,"chicken biryani|चिकन बिर्याणी|biryani chicken"],
["egg_biryani","Egg Biryani","अंडा बिर्याणी","rice","north","plate",280,520,19,68,18,3.5,11,EGG,2,"egg biryani|anda biryani|अंडा बिर्याणी"],
["mutton_biryani","Mutton Biryani","मटण बिर्याणी","rice","north","plate",300,680,30,70,30,3.5,14,NONVEG,1,"mutton biryani|मटण बिर्याणी"],
["fried_rice_veg","Veg Fried Rice","फ्राईड राईस","rice","generic","plate",220,360,7,58,11,3,9,VEG,2,"fried rice|veg fried rice|फ्राईड राईस"],
["daliya","Daliya / Lapshi","दलिया","rice","north","bowl",200,180,6,34,2,5,1,VEG,5,"daliya|dalia|lapsi|broken wheat|दलिया|लापशी"],
["quinoa_cooked","Cooked Quinoa","क्विनोआ","rice","generic","bowl",150,190,7,33,3,4,0,VEG,5,"quinoa|क्विनोआ"],

// ——— Dals, varan, usal, legumes ——————————————————————————————————————
["varan","Varan (plain toor dal)","वरण","dal","mh","bowl",150,150,8,20,3,4.5,2,VEG,5,"varan|waran|plain dal|dal|daal|toor varan|तूर वरण|वरण|डाळ|दाल|varan bhat varan|simple dal"],
["toor_dal","Toor Dal","तूर डाळ","dal","generic","bowl",150,180,9,22,5,5,4,VEG,5,"toor dal|arhar dal|tur dal|तूर डाळ|अरहर दाल"],
["moong_dal","Moong Dal","मूग डाळ","dal","generic","bowl",150,160,9,21,4,4.5,3.5,VEG,5,"moong dal|mung dal|मूग डाळ|मूंग दाल"],
["masoor_dal","Masoor Dal","मसूर डाळ","dal","generic","bowl",150,170,9.5,22,4.5,5,3.5,VEG,5,"masoor dal|masur dal|मसूर डाळ|मसूर दाल"],
["chana_dal","Chana Dal","चणा डाळ","dal","generic","bowl",150,220,11,30,6,7,4,VEG,5,"chana dal|channa dal|चणा डाळ|चना दाल"],
["urad_dal","Urad Dal","उडीद डाळ","dal","generic","bowl",150,220,11,28,7,6,4.5,VEG,4,"urad dal|udid dal|udid varan|उडीद डाळ|उडीद वरण|उड़द दाल"],
["mixed_dal","Mixed Dal","मिक्स डाळ","dal","generic","bowl",150,190,9.5,25,5.5,5.5,4,VEG,5,"mixed dal|panchmel dal|मिक्स डाळ"],
["dal_fry","Dal Fry","डाळ फ्राय","dal","north","bowl",150,230,9,25,9,5,8,VEG,4,"dal fry|daal fry|डाळ फ्राय"],
["dal_tadka","Dal Tadka","डाळ तडका","dal","north","bowl",150,250,9,26,11,5,10,VEG,3,"dal tadka|tadka dal|डाळ तडका"],
["dal_makhani","Dal Makhani","डाळ मखनी","dal","punj","bowl",150,330,10,26,20,6,14,VEG,2,"dal makhani|dal makhni|डाळ मखनी"],
["dal_palak","Dal Palak","पालक डाळ","dal","north","bowl",150,210,10,24,7,6,6,VEG,5,"dal palak|palak dal|पालक डाळ"],
["amti","Amti","आमटी","dal","mh","bowl",150,170,7.5,22,5,4.5,4,VEG,4,"amti|aamti|आमटी|katachi amti|goda amti"],
["sambar","Sambar","सांबार","dal","south","bowl",150,150,7,20,4.5,5,4,VEG,5,"sambar|sambhar|सांबार"],
["rasam","Rasam","रसम","dal","south","bowl",150,70,3,10,2,1.5,2,VEG,5,"rasam|saaru|रसम"],
["kadhi","Kadhi","कढी","dal","generic","bowl",150,180,6,14,10,1.5,6,VEG,3,"kadhi|kadi|कढी"],
["rajma","Rajma","राजमा","dal","punj","bowl",150,260,11,34,8,10,7,VEG,5,"rajma|rajmah|kidney beans|राजमा"],
["chole","Chole / Chana Masala","छोले","dal","punj","bowl",150,280,11,38,9,10,8,VEG,4,"chole|chana masala|chhole|छोले|चना मसाला"],
["black_chana","Black Chana Curry","काळा चणा","dal","mh","bowl",150,240,11,34,6,10,5,VEG,5,"black chana|kala chana|काळा चणा|काला चना|chana amti"],
["lobia","Lobia / Chawli","चवळी","dal","generic","bowl",150,230,12,32,6,9,5,VEG,5,"lobia|chawli|chavli|black eyed peas|चवळी|लोबिया"],
["green_moong_curry","Green Moong Curry","मूग आमटी","dal","mh","bowl",150,210,12,30,4,9,4,VEG,5,"green moong|mug amti|मूग आमटी|whole moong"],
["pithla","Pithla","पिठलं","dal","mh","bowl",150,200,9,20,9,5,8,VEG,4,"pithla|pithale|pitla|पिठलं|पिठलं भाकरी|पिठले"],
["zunka","Zunka","झुणका","dal","mh","bowl",120,230,9,22,12,5,10,VEG,3,"zunka|jhunka|झुणका|zunka bhakar"],
["matki_usal","Matki Usal","मटकीची उसळ","usal","mh","bowl",150,230,12,30,7,9,6,VEG,5,"matki usal|matki chi usal|matkichi usal|moth beans|मटकीची उसळ|मटकी उसळ|matki"],
["chana_usal","Chana Usal","चण्याची उसळ","usal","mh","bowl",150,240,12,32,7,9,6,VEG,5,"chana usal|chanyachi usal|चण्याची उसळ|चणा उसळ"],
["moong_usal","Moong Usal","मुगाची उसळ","usal","mh","bowl",150,200,12,26,5,8,5,VEG,5,"moong usal|mug usal|mugachi usal|मुगाची उसळ|मूग उसळ"],
["vatana_usal","Vatana Usal","वाटाण्याची उसळ","usal","mh","bowl",150,235,11,33,6.5,8,6,VEG,4,"vatana usal|watana usal|white peas usal|वाटाण्याची उसळ|वाटाणा उसळ"],
["mixed_usal","Mixed Sprouts Usal","मिक्स उसळ","usal","mh","bowl",150,220,11,29,6.5,8.5,6,VEG,5,"mixed usal|usal|mix usal|sprouts usal|मिक्स उसळ|उसळ|मोड आलेली उसळ"],
["misal","Misal (no pav)","मिसळ","usal","mh","bowl",200,300,12,34,13,9,11,VEG,3,"misal|misal without pav|मिसळ"],

// ——— Sabzi / bhaji ——————————————————————————————————————————————————
["bhendi_bhaji","Bhendi Bhaji","भेंडीची भाजी","sabzi","mh","bowl",120,130,2.5,12,8,5,7,VEG,4,"bhendi bhaji|bhendi|bhindi|bhindi sabzi|okra|ladyfinger|भेंडी|भेंडीची भाजी|भेंडी भाजी"],
["batata_bhaji","Batata Bhaji","बटाट्याची भाजी","sabzi","mh","bowl",150,200,3.5,30,7.5,3.5,7,VEG,3,"batata bhaji|aloo sabzi|aloo ki sabzi|potato sabzi|बटाट्याची भाजी|बटाटा भाजी|आलू की सब्जी"],
["mixed_sabzi","Mixed Vegetable Bhaji","मिक्स भाजी","sabzi","generic","bowl",130,150,4,16,7.5,5,7,VEG,4,"mixed sabzi|mix veg|bhaji|sabzi|subzi|vegetable|भाजी|मिक्स भाजी|सब्जी"],
["aloo_gobi","Aloo Gobi","बटाटा फ्लॉवर","sabzi","north","bowl",140,200,4,23,10,5,9,VEG,3,"aloo gobi|batata flower|बटाटा फ्लॉवर|आलू गोभी"],
["gobi_bhaji","Cauliflower Bhaji","फ्लॉवरची भाजी","sabzi","generic","bowl",120,130,3.5,11,8,4,7,VEG,4,"gobi sabzi|cauliflower|flower bhaji|फ्लॉवर भाजी|गोभी की सब्जी"],
["kobi_bhaji","Cabbage Bhaji","कोबीची भाजी","sabzi","mh","bowl",120,115,2.5,11,6.5,4,6,VEG,5,"cabbage sabzi|kobi bhaji|patta gobi|कोबीची भाजी|कोबी भाजी|पत्ता गोभी"],
["beans_bhaji","Green Beans Bhaji","फरसबीची भाजी","sabzi","generic","bowl",120,130,3,12,7,5,6,VEG,5,"beans sabzi|farasbi bhaji|green beans|फरसबी|फरसबीची भाजी"],
["gajar_beans","Carrot Beans Bhaji","गाजर फरसबी","sabzi","generic","bowl",120,140,3,15,7,5,6,VEG,5,"carrot beans|gajar beans|गाजर फरसबी"],
["methi_bhaji","Methi Bhaji","मेथीची भाजी","sabzi","mh","bowl",120,125,4.5,9,7.5,5,6.5,VEG,5,"methi bhaji|methi sabzi|fenugreek|मेथीची भाजी|मेथी भाजी"],
["palak_bhaji","Palak Bhaji","पालकाची भाजी","sabzi","generic","bowl",120,115,4,8,7,4.5,6.5,VEG,5,"palak bhaji|palak sabzi|spinach|पालकाची भाजी|पालक भाजी"],
["bharli_vangi","Bharli Vangi","भरली वांगी","sabzi","mh","bowl",150,250,5,20,16,6,12,VEG,3,"bharli vangi|bharleli vangi|stuffed brinjal|भरली वांगी|भरलेली वांगी"],
["vangyache_bharit","Vangyache Bharit","वांग्याचे भरीत","sabzi","mh","bowl",140,170,3.5,14,11,5,9,VEG,4,"bharit|baingan bharta|vangyache bharit|वांग्याचे भरीत|भरीत|बैंगन भर्ता"],
["vangi_bhaji","Vangi Bhaji","वांग्याची भाजी","sabzi","mh","bowl",130,160,3,14,10,5,8,VEG,4,"vangi bhaji|baingan sabzi|brinjal|eggplant|वांग्याची भाजी|वांगी भाजी"],
["dudhi_bhaji","Dudhi Bhaji","दुधीची भाजी","sabzi","generic","bowl",120,95,2,9,5.5,3,5,VEG,5,"dudhi bhaji|lauki sabzi|bottle gourd|दुधी भोपळा|दुधीची भाजी|लौकी"],
["dodka_bhaji","Dodka Bhaji","दोडक्याची भाजी","sabzi","mh","bowl",120,100,2.2,9,6,3,5.5,VEG,5,"dodka bhaji|turai sabzi|ridge gourd|दोडका|दोडक्याची भाजी|तुरई"],
["tondli_bhaji","Tondli Bhaji","तोंडल्याची भाजी","sabzi","mh","bowl",120,120,2.5,10,7.5,4,6.5,VEG,5,"tondli bhaji|tendli|ivy gourd|तोंडली|तोंडल्याची भाजी"],
["karle_bhaji","Karle Bhaji","कारल्याची भाजी","sabzi","mh","bowl",120,120,2.5,10,7.5,4.5,6.5,VEG,5,"karle bhaji|karela sabzi|bitter gourd|कारले|कारल्याची भाजी|करेला"],
["bhopla_bhaji","Pumpkin Bhaji","भोपळ्याची भाजी","sabzi","mh","bowl",120,120,2,15,6,3.5,5,VEG,5,"bhopla bhaji|kaddu sabzi|pumpkin|लाल भोपळा|भोपळ्याची भाजी|कद्दू"],
["capsicum_bhaji","Capsicum Bhaji","ढोबळी मिरची भाजी","sabzi","generic","bowl",120,135,2.5,11,8.5,4,7,VEG,4,"capsicum sabzi|shimla mirch|dhobli mirchi|ढोबळी मिरची|शिमला मिर्च"],
["matar_bhaji","Green Peas Bhaji","मटारची भाजी","sabzi","generic","bowl",130,180,7,22,7,7,6,VEG,5,"matar sabzi|green peas|vatana bhaji|मटार भाजी|मटारची भाजी"],
["beet_bhaji","Beetroot Bhaji","बीटची भाजी","sabzi","generic","bowl",120,130,3,17,5.5,4,5,VEG,5,"beetroot sabzi|beet bhaji|बीट भाजी"],
["mushroom_masala","Mushroom Masala","मशरूम मसाला","sabzi","generic","bowl",130,190,6,12,13,3.5,10,VEG,4,"mushroom masala|mushroom sabzi|मशरूम"],
["palak_paneer","Palak Paneer","पालक पनीर","sabzi","punj","bowl",150,300,14,12,22,4.5,12,VEG,3,"palak paneer|पालक पनीर"],
["matar_paneer","Matar Paneer","मटार पनीर","sabzi","punj","bowl",150,330,14,20,21,5,12,VEG,3,"matar paneer|mutter paneer|मटार पनीर"],
["paneer_bhurji","Paneer Bhurji","पनीर भुर्जी","sabzi","north","bowl",130,340,18,9,26,2,12,VEG,3,"paneer bhurji|पनीर भुर्जी"],
["paneer_masala","Paneer Masala","पनीर मसाला","sabzi","punj","bowl",150,360,15,16,27,3,14,VEG,2,"paneer masala|shahi paneer|paneer butter masala|पनीर मसाला|पनीर बटर मसाला"],
["kothimbir_vadi","Kothimbir Vadi","कोथिंबीर वडी","snack","mh","piece",25,75,2.5,7.5,3.7,1.6,3,VEG,3,"kothimbir vadi|kothimbir wadi|कोथिंबीर वडी"],
["alu_vadi","Alu Vadi","अळू वडी","snack","mh","piece",25,70,1.9,8,3.5,1.6,3,VEG,3,"alu vadi|aluvadi|patra|अळूवडी|अळू वडी"],
["sev_bhaji","Sev Bhaji","शेव भाजी","sabzi","mh","bowl",150,320,8,24,21,5,14,VEG,2,"sev bhaji|शेव भाजी"],

// ——— Breakfast ——————————————————————————————————————————————————————
["kanda_poha","Kanda Poha","कांदा पोहे","breakfast","mh","bowl",180,250,5,40,8,3,7,VEG,4,"poha|pohe|kanda poha|kande pohe|पोहे|कांदा पोहे|पोहा"],
["batata_poha","Batata Poha","बटाटा पोहे","breakfast","mh","bowl",190,270,5,44,8.5,3,7,VEG,3,"batata poha|aloo poha|बटाटा पोहे"],
["upma","Upma","उपमा","breakfast","south","bowl",180,260,6,38,9,3.5,8,VEG,3,"upma|uppama|सांजा|उपमा|upit|उप्पीट"],
["sabudana_khichdi","Sabudana Khichdi","साबुदाणा खिचडी","breakfast","mh","bowl",180,400,5,58,17,2,10,VEG,2,"sabudana khichdi|sabudana|sago khichdi|साबुदाणा खिचडी|साबुदाणा"],
["idli","Idli","इडली","breakfast","south","piece",40,60,2,12,0.3,0.8,0,VEG,5,"idli|idly|इडली"],
["dosa_plain","Plain Dosa","डोसा","breakfast","south","piece",90,170,4,28,4.5,1.5,4,VEG,4,"dosa|dosai|plain dosa|sada dosa|डोसा|साधा डोसा"],
["masala_dosa","Masala Dosa","मसाला डोसा","breakfast","south","piece",160,330,6,50,12,3.5,8,VEG,3,"masala dosa|मसाला डोसा"],
["uttapam","Uttapam","उत्तपम","breakfast","south","piece",130,270,6.5,42,8.5,2.5,6,VEG,3,"uttapam|uthappam|उत्तपम"],
["medu_vada","Medu Vada","मेदू वडा","breakfast","south","piece",40,110,3,12,5.5,1.5,5,VEG,2,"medu vada|meduvada|मेदू वडा|उडीद वडा"],
["appe","Appe / Paniyaram","आप्पे","breakfast","mh","piece",20,40,1,6,1.2,0.4,1,VEG,4,"appe|appam paniyaram|paniyaram|आप्पे"],
["sheera","Sheera","शिरा","sweet","mh","bowl",120,330,4,48,13,1.5,10,VEG,2,"sheera|shira|sooji halwa|rava sheera|शिरा|सांजा गोड"],
["oats_porridge","Oats Porridge","ओट्स","breakfast","generic","bowl",200,190,7,30,4,5,0,VEG,5,"oats|oatmeal|porridge|ओट्स"],
["muesli_milk","Muesli with milk","म्युसली","breakfast","generic","bowl",200,290,10,45,7,6,0,VEG,4,"muesli|granola|म्युसली"],
["cornflakes_milk","Cornflakes with milk","कॉर्नफ्लेक्स","breakfast","generic","bowl",200,230,8,42,3.5,1.5,0,VEG,3,"cornflakes|corn flakes|कॉर्नफ्लेक्स"],
["egg_bhurji","Egg Bhurji","अंडा भुर्जी","egg","mh","bowl",120,220,13,4,17,1,7,EGG,3,"egg bhurji|anda bhurji|scrambled egg|अंडा भुर्जी|अंडाभुर्जी"],
["omelette","Omelette","ऑम्लेट","egg","generic","piece",110,190,12,2,15,0.5,6,EGG,3,"omelette|omlet|ऑम्लेट|अंडा ऑम्लेट"],
["boiled_egg","Boiled Egg","उकडलेले अंडे","egg","generic","piece",50,78,6.3,0.6,5.3,0,0,EGG,4,"egg|boiled egg|anda|अंडे|उकडलेले अंडे|अंडा|ande"],
["egg_white","Egg White","अंड्याचा पांढरा भाग","egg","generic","piece",33,17,3.6,0.2,0.1,0,0,EGG,5,"egg white|अंड्याचा पांढरा"],
["dhokla","Dhokla","ढोकळा","breakfast","guj","plate",100,180,7,28,4,3,3,VEG,4,"dhokla|ढोकळा"],
["khandvi","Khandvi","खांडवी","breakfast","guj","plate",100,160,6,18,7,2,5,VEG,4,"khandvi|खांडवी"],
["veg_sandwich","Veg Sandwich","व्हेज सँडविच","breakfast","generic","piece",150,280,8,40,10,4,6,VEG,3,"sandwich|veg sandwich|सँडविच"]
];

const ROWS2 = [
// ——— Street food & namkeen ——————————————————————————————————————————
["vada_pav","Vada Pav","वडापाव","street","mh","piece",130,320,7,45,13,3.5,10,VEG,1,"vada pav|vadapav|wada pav|वडापाव|वडा पाव"],
["batata_vada","Batata Vada","बटाटा वडा","street","mh","piece",55,150,3,18,7.5,2,6,VEG,2,"batata vada|batata wada|aloo vada|बटाटा वडा|वडा"],
["pav_bhaji","Pav Bhaji","पावभाजी","street","mh","plate",350,430,10,58,18,7,14,VEG,2,"pav bhaji|pavbhaji|पावभाजी|पाव भाजी"],
["misal_pav","Misal Pav","मिसळ पाव","street","mh","plate",300,500,16,58,21,10,14,VEG,2,"misal pav|misalpav|मिसळ पाव|मिसळपाव"],
["samosa","Samosa","समोसा","street","north","piece",60,260,4.5,30,13,2.5,10,VEG,1,"samosa|समोसा"],
["kachori","Kachori","कचोरी","street","raj","piece",55,280,5,30,15,3,12,VEG,1,"kachori|कचोरी"],
["pakora","Pakora / Bhaji","भजी","street","generic","plate",80,300,8,26,18,4,15,VEG,1,"pakora|bhajiya|bhaji pakoda|kanda bhaji|onion bhaji|भजी|कांदा भजी|पकोडा"],
["bhel","Bhel Puri","भेळ","street","mh","plate",120,230,5,38,7,4,4,VEG,3,"bhel|bhel puri|bhelpuri|भेळ|भेळपुरी"],
["sev_puri","Sev Puri","शेवपुरी","street","mh","plate",120,320,6,40,15,4,10,VEG,2,"sev puri|sevpuri|शेवपुरी"],
["pani_puri","Pani Puri","पाणीपुरी","street","generic","plate",120,240,4,40,7,3,5,VEG,2,"pani puri|panipuri|golgappa|puchka|पाणीपुरी|पाणी पुरी"],
["dabeli","Dabeli","दाबेली","street","guj","piece",120,300,6,44,11,3,8,VEG,2,"dabeli|दाबेली"],
["bakarwadi","Bakarwadi","बाकरवडी","snack","mh","piece",15,75,1.5,7.5,4.2,1,0,VEG,2,"bakarwadi|bhakarwadi|बाकरवडी|भाकरवडी"],
["chakli","Chakli","चकली","snack","mh","piece",25,130,2.5,14,7.5,1.5,0,VEG,2,"chakli|chakali|murukku|चकली"],
["chivda","Chivda","चिवडा","snack","mh","bowl",30,145,3,18,7,2,0,VEG,2,"chivda|chiwda|चिवडा|पोहे चिवडा"],
["farsan","Farsan / Mixture","फरसाण","snack","guj","bowl",30,160,3.5,15,9.5,2,0,VEG,2,"farsan|mixture|namkeen|फरसाण|मिक्स्चर"],
["sev","Sev","शेव","snack","generic","tbsp",10,55,1.4,5,3.3,0.7,0,VEG,2,"sev|शेव"],
["biscuit_marie","Marie biscuit","मारी बिस्कीट","snack","generic","piece",6,27,0.5,4.5,0.8,0.15,0,VEG,2,"marie biscuit|biscuit|parle|बिस्कीट|मारी"],
["biscuit_cream","Cream biscuit","क्रीम बिस्कीट","snack","generic","piece",12,55,0.6,8,2.2,0.2,0,VEG,1,"cream biscuit|bourbon|क्रीम बिस्कीट"],
["khari","Khari","खारी","snack","generic","piece",10,50,0.8,5.5,2.7,0.2,0,VEG,1,"khari|khari biscuit|खारी|puff biscuit"],
["toast_butter","Toast with butter","बटर टोस्ट","snack","generic","slice",33,110,2.5,14,5,0.8,4,VEG,2,"butter toast|toast|बटर टोस्ट"],
["chips","Potato chips","चिप्स","snack","generic","bowl",30,165,2,15,11,1.2,0,VEG,1,"chips|wafers|potato chips|चिप्स|वेफर्स"],
["popcorn","Popcorn (plain)","पॉपकॉर्न","snack","generic","bowl",20,80,2.5,15,2.5,3,0,VEG,4,"popcorn|पॉपकॉर्न"],
["papad_roasted","Roasted Papad","भाजलेला पापड","snack","generic","piece",12,40,2.5,6,0.4,1,0,VEG,3,"papad|roasted papad|papadum|पापड|भाजलेला पापड"],
["papad_fried","Fried Papad","तळलेला पापड","snack","generic","piece",14,75,2.4,6,4.5,1,3,VEG,1,"fried papad|तळलेला पापड"],

// ——— Non-vegetarian ————————————————————————————————————————————————
["chicken_curry","Chicken Curry","चिकन करी","nonveg","mh","bowl",150,280,24,7,18,1.5,10,NONVEG,3,"chicken curry|chicken masala|chicken|चिकन|चिकन करी|chicken rassa"],
["chicken_sukka","Chicken Sukka","सुक्कं चिकन","nonveg","mh","bowl",130,300,26,6,20,2,11,NONVEG,3,"chicken sukka|sukka chicken|सुक्कं चिकन|चिकन सुक्का"],
["chicken_kolhapuri","Chicken Kolhapuri","कोल्हापुरी चिकन","nonveg","mh","bowl",150,330,24,9,22,2,12,NONVEG,2,"chicken kolhapuri|kolhapuri chicken|तांबडा रस्सा|कोल्हापुरी चिकन"],
["tandoori_chicken","Tandoori Chicken","तंदूरी चिकन","nonveg","punj","piece",150,250,32,4,12,0.5,4,NONVEG,4,"tandoori chicken|grilled chicken leg|तंदूरी चिकन"],
["chicken_breast","Grilled Chicken Breast","ग्रिल चिकन","nonveg","generic","piece",100,165,31,0,3.6,0,0,NONVEG,5,"chicken breast|grilled chicken|boiled chicken|ग्रिल चिकन"],
["fish_curry","Fish Curry","माशाचं कालवण","nonveg","mh","bowl",150,220,22,6,12,1.5,8,NONVEG,4,"fish curry|macchi curry|माशाचे कालवण|फिश करी|मासे"],
["fried_fish","Fried Fish","तळलेला मासा","nonveg","mh","piece",100,230,20,8,13,0.5,9,NONVEG,3,"fried fish|fish fry|तळलेला मासा|फिश फ्राय"],
["grilled_fish","Grilled Fish","ग्रिल फिश","nonveg","generic","piece",100,160,22,0,7,0,2,NONVEG,5,"grilled fish|steamed fish|ग्रिल फिश"],
["bombil_fry","Bombil Fry","बोंबील फ्राय","nonveg","mh","piece",80,190,17,7,10,0.3,7,NONVEG,3,"bombil|bombil fry|bombay duck|बोंबील"],
["prawn_curry","Prawn Curry","कोळंबी करी","nonveg","mh","bowl",150,230,22,7,12,1.5,8,NONVEG,4,"prawn curry|kolambi|shrimp|कोळंबी"],
["mutton_curry","Mutton Curry","मटण करी","nonveg","mh","bowl",150,380,24,6,29,1.5,12,NONVEG,2,"mutton curry|mutton|मटण|मटण करी|मटण रस्सा"],
["kheema","Kheema","खिमा","nonveg","north","bowl",130,330,22,5,25,1.5,10,NONVEG,2,"kheema|keema|खिमा"],
["egg_curry","Egg Curry","अंडा करी","egg","generic","bowl",180,280,14,8,21,1.5,9,EGG,3,"egg curry|anda curry|अंडा करी"],

// ——— Dairy & drinks ————————————————————————————————————————————————
["curd","Curd / Dahi","दही","dairy","generic","bowl",150,100,5.5,7,5,0,0,VEG,4,"curd|dahi|yogurt|दही|ताक दही"],
["curd_lowfat","Low-fat Curd","कमी फॅट दही","dairy","generic","bowl",150,70,6,7,2,0,0,VEG,5,"low fat curd|skim curd|कमी फॅट दही"],
["milk_full","Full-fat Milk","दूध","dairy","generic","glass",200,150,6.4,10,8,0,0,VEG,3,"milk|full fat milk|doodh|दूध"],
["milk_toned","Toned Milk","टोन्ड दूध","dairy","generic","glass",200,115,6.4,10,5,0,0,VEG,4,"toned milk|low fat milk|टोन्ड दूध"],
["buttermilk","Buttermilk / Taak","ताक","dairy","mh","glass",200,40,2,4,1.5,0,0,VEG,5,"buttermilk|chaas|chhaas|taak|तक|ताक|छाछ"],
["lassi_sweet","Sweet Lassi","गोड लस्सी","dairy","punj","glass",250,220,6,34,6,0,0,VEG,2,"sweet lassi|lassi|लस्सी|गोड लस्सी"],
["lassi_salted","Salted Lassi","खारी लस्सी","dairy","punj","glass",250,110,6,9,5,0,0,VEG,4,"salted lassi|namkeen lassi|खारी लस्सी"],
["paneer","Paneer","पनीर","dairy","generic","bowl",100,296,18,3.5,23,0,0,VEG,3,"paneer|cottage cheese|पनीर"],
["tofu","Tofu","टोफू","dairy","generic","bowl",100,145,15,3,9,1,0,VEG,5,"tofu|टोफू|soya paneer"],
["cheese_slice","Cheese slice","चीज स्लाईस","dairy","generic","slice",20,70,4,1,5.6,0,0,VEG,2,"cheese|cheese slice|चीज"],
["butter","Butter","लोणी","fat","generic","tsp",5,36,0,0,4,0,0,VEG,2,"butter|loni|makhan|लोणी|बटर|माखन"],
["ghee","Ghee","तूप","fat","generic","tsp",5,45,0,0,5,0,0,VEG,3,"ghee|tup|तूप|घी"],
["oil","Cooking oil","तेल","fat","generic","tsp",5,45,0,0,5,0,0,VEG,3,"oil|tel|तेल|cooking oil"],
["tea_milk_sugar","Tea with milk & sugar","चहा","drink","generic","cup",150,80,2,11,2.5,0,0,VEG,2,"tea|chai|chaha|चहा|चाय|milk tea"],
["tea_no_sugar","Tea, no sugar","बिनसाखर चहा","drink","generic","cup",150,45,2,4,2.5,0,0,VEG,4,"tea without sugar|no sugar chai|बिनसाखर चहा|फिका चहा"],
["black_tea","Black Tea / Green Tea","ग्रीन टी","drink","generic","cup",150,5,0,1,0,0,0,VEG,5,"black tea|green tea|ग्रीन टी|काळा चहा|herbal tea"],
["coffee_milk_sugar","Coffee with milk & sugar","कॉफी","drink","generic","cup",150,90,2.2,12,2.8,0,0,VEG,2,"coffee|कॉफी|filter coffee"],
["nimbu_pani","Lemon water with sugar","लिंबू सरबत","drink","generic","glass",200,60,0,15,0,0,0,VEG,3,"nimbu pani|lemon water|sarbat|लिंबू सरबत|शिकंजी"],
["nimbu_pani_plain","Lemon water, no sugar","बिनसाखर लिंबू पाणी","drink","generic","glass",200,10,0,2,0,0,0,VEG,5,"lemon water no sugar|बिनसाखर लिंबू पाणी"],
["coconut_water","Coconut Water","शहाळ्याचं पाणी","drink","generic","glass",200,45,0.5,9,0,0,0,VEG,5,"coconut water|nariyal pani|shahale|शहाळे|नारळ पाणी"],
["soft_drink","Soft drink","कोल्ड्रिंक","drink","generic","glass",250,105,0,26,0,0,0,VEG,1,"cold drink|soft drink|cola|pepsi|coke|कोल्ड्रिंक|सॉफ्ट ड्रिंक"],
["fruit_juice","Packaged fruit juice","फळांचा रस","drink","generic","glass",200,110,0.5,27,0,0.3,0,VEG,2,"fruit juice|juice|ज्यूस|फळांचा रस"],
["beer","Beer","बिअर","drink","generic","glass",330,145,1.5,11,0,0,0,VEG,2,"beer|बिअर"],
["whisky","Whisky / Spirit (30 ml)","व्हिस्की","drink","generic","piece",30,70,0,0,0,0,0,VEG,2,"whisky|rum|vodka|peg|व्हिस्की"],
["wine","Wine","वाईन","drink","generic","glass",150,125,0,4,0,0,0,VEG,2,"wine|वाईन"],

// ——— Fruits ————————————————————————————————————————————————————————
["banana","Banana","केळं","fruit","generic","piece",120,105,1.3,27,0.4,3,0,VEG,5,"banana|kela|kele|केळं|केळी|केला"],
["apple","Apple","सफरचंद","fruit","generic","piece",180,95,0.5,25,0.3,4.4,0,VEG,5,"apple|seb|सफरचंद|सेब"],
["mango","Mango","आंबा","fruit","generic","piece",200,150,1.4,38,0.6,2.6,0,VEG,4,"mango|aam|amba|आंबा|आम"],
["orange","Orange","संत्रं","fruit","generic","piece",130,60,1.2,15,0.2,3,0,VEG,5,"orange|santra|संत्रं|संत्री|नारंगी"],
["mosambi","Sweet Lime","मोसंबी","fruit","generic","piece",150,65,1.2,16,0.2,3,0,VEG,5,"mosambi|sweet lime|musambi|मोसंबी"],
["guava","Guava","पेरू","fruit","generic","piece",120,70,2.6,16,0.9,5.4,0,VEG,5,"guava|peru|amrud|पेरू|अमरूद"],
["papaya","Papaya","पपई","fruit","generic","bowl",145,60,0.9,15,0.2,2.5,0,VEG,5,"papaya|papai|पपई"],
["watermelon","Watermelon","कलिंगड","fruit","generic","bowl",150,45,0.9,11,0.2,0.6,0,VEG,5,"watermelon|kalingad|tarbuj|कलिंगड|तरबूज"],
["muskmelon","Muskmelon","खरबूज","fruit","generic","bowl",150,55,1.3,13,0.3,1.4,0,VEG,5,"muskmelon|kharbuj|खरबूज"],
["grapes","Grapes","द्राक्षं","fruit","generic","bowl",100,70,0.7,18,0.2,0.9,0,VEG,4,"grapes|draksha|angur|द्राक्षे|द्राक्षं|अंगूर"],
["pomegranate","Pomegranate","डाळिंब","fruit","generic","bowl",90,85,1.6,19,1.2,3.5,0,VEG,5,"pomegranate|anar|dalimb|डाळिंब|अनार"],
["chikoo","Chikoo / Sapota","चिकू","fruit","generic","piece",100,140,0.7,34,1.1,5,0,VEG,4,"chikoo|chiku|sapota|चिकू"],
["sitaphal","Custard Apple","सीताफळ","fruit","generic","piece",100,140,2.1,34,0.6,4.4,0,VEG,4,"custard apple|sitaphal|sharifa|सीताफळ"],
["pineapple","Pineapple","अननस","fruit","generic","bowl",150,80,0.9,20,0.2,2.1,0,VEG,5,"pineapple|ananas|अननस"],
["pear","Pear","पेअर","fruit","generic","piece",170,100,0.6,27,0.2,5,0,VEG,5,"pear|nashpati|पेअर|नाशपाती"],
["strawberry","Strawberries","स्ट्रॉबेरी","fruit","generic","bowl",150,50,1,12,0.5,3,0,VEG,5,"strawberry|strawberries|स्ट्रॉबेरी"],
["kiwi","Kiwi","किवी","fruit","generic","piece",75,45,0.8,11,0.4,2.1,0,VEG,5,"kiwi|किवी"],
["dates","Dates","खजूर","fruit","generic","piece",8,23,0.2,6,0,0.6,0,VEG,4,"dates|khajur|khajoor|खजूर"],
["amla","Amla","आवळा","fruit","generic","piece",50,25,0.3,6,0.1,1.7,0,VEG,5,"amla|awla|आवळा"],
["raisins","Raisins","मनुका","fruit","generic","tbsp",15,45,0.5,12,0.1,0.6,0,VEG,4,"raisins|kishmish|manuka|मनुका|किशमिश"],

// ——— Salads & vegetables ——————————————————————————————————————————
["green_salad","Green Salad","सॅलड","salad","generic","plate",100,35,1.5,6,0.3,2.5,0,VEG,5,"salad|green salad|सॅलड|कोशिंबीर सलाड"],
["kachumber","Kachumber","कचुंबर","salad","mh","bowl",120,50,1.5,7,1.5,2.5,1,VEG,5,"kachumber|kachumbar|कचुंबर"],
["koshimbir","Koshimbir","कोशिंबीर","salad","mh","bowl",120,90,3,8,5,2.5,0,VEG,4,"koshimbir|kakdi koshimbir|कोशिंबीर"],
["kakdi","Cucumber","काकडी","salad","generic","bowl",100,20,0.7,4,0.1,0.8,0,VEG,5,"cucumber|kakdi|kheera|काकडी|खीरा"],
["carrot_salad","Carrot Salad","गाजर सॅलड","salad","generic","bowl",100,60,1,12,0.3,3.5,0,VEG,5,"carrot salad|gajar|गाजर"],
["onion_salad","Onion Salad","कांदा","salad","generic","plate",60,25,0.7,6,0.1,1.2,0,VEG,5,"onion salad|kanda|pyaz|कांदा|प्याज"],
["tomato_salad","Tomato Salad","टोमॅटो","salad","generic","bowl",100,20,0.9,4,0.2,1.2,0,VEG,5,"tomato salad|tamatar|टोमॅटो"],
["sprouts_salad","Sprouts Salad","मोड आलेले कडधान्य","salad","mh","bowl",100,140,9,22,1,6,0,VEG,5,"sprouts salad|mod aalele|मोड आलेले|sprouts"],
["raita","Raita","रायतं","salad","north","bowl",150,120,5,9,7,1,0,VEG,4,"raita|रायतं|रायता"],
["boiled_veg","Boiled Vegetables","उकडलेल्या भाज्या","salad","generic","bowl",150,70,3,13,0.5,4.5,0,VEG,5,"boiled vegetables|steamed veg|उकडलेल्या भाज्या"],
["veg_soup","Vegetable Soup","भाज्यांचं सूप","salad","generic","bowl",200,90,3,14,2.5,2.5,1,VEG,5,"soup|veg soup|सूप"],
["tomato_soup","Tomato Soup","टोमॅटो सूप","salad","generic","bowl",200,110,2.5,18,3.5,2,2,VEG,4,"tomato soup|टोमॅटो सूप"],

// ——— Nuts, seeds & condiments ————————————————————————————————————
["almonds","Almonds","बदाम","nuts","generic","piece",1.2,7,0.26,0.26,0.6,0.15,0,VEG,5,"almond|almonds|badam|बदाम"],
["walnuts","Walnut halves","अक्रोड","nuts","generic","piece",2.5,16,0.4,0.35,1.6,0.17,0,VEG,5,"walnut|walnuts|akhrot|akrod|अक्रोड"],
["cashew","Cashew","काजू","nuts","generic","piece",1.5,9,0.27,0.45,0.7,0.05,0,VEG,4,"cashew|kaju|काजू"],
["pista","Pistachio","पिस्ता","nuts","generic","piece",0.8,4.5,0.16,0.22,0.36,0.08,0,VEG,5,"pistachio|pista|पिस्ता"],
["peanuts","Peanuts","शेंगदाणे","nuts","mh","tbsp",15,87,3.9,2.4,7.2,1.2,0,VEG,4,"peanut|peanuts|shengdana|mungfali|शेंगदाणे|मूंगफली"],
["flax_seeds","Flax seeds","जवस","nuts","mh","tbsp",10,55,1.8,3,4.2,2.7,0,VEG,5,"flax seeds|alsi|jawas|javas|जवस|अळशी"],
["chia_seeds","Chia seeds","चिया","nuts","generic","tbsp",12,58,2,5,3.7,4.1,0,VEG,5,"chia|chia seeds|चिया"],
["sunflower_seeds","Sunflower seeds","सूर्यफूल बिया","nuts","generic","tbsp",10,58,2,2,5,0.9,0,VEG,5,"sunflower seeds|सूर्यफूल बिया"],
["coconut_chutney","Coconut Chutney","नारळाची चटणी","misc","south","tbsp",20,55,1,2.5,4.6,1.2,1,VEG,3,"coconut chutney|नारळाची चटणी|khobra chutney"],
["green_chutney","Green Chutney","हिरवी चटणी","misc","generic","tbsp",15,15,0.5,2,0.5,0.7,0,VEG,5,"green chutney|kothimbir chutney|हिरवी चटणी"],
["shengdana_chutney","Peanut Chutney","शेंगदाणा चटणी","misc","mh","tbsp",12,65,2.8,2.5,5,1,0,VEG,4,"shengdana chutney|peanut chutney|dana chutney|शेंगदाणा चटणी"],
["pickle","Pickle","लोणचं","misc","generic","tsp",8,25,0.1,1,2.3,0.3,2,VEG,1,"pickle|achar|lonche|लोणचं|अचार"],
["sugar","Sugar","साखर","misc","generic","tsp",5,20,0,5,0,0,0,VEG,1,"sugar|sakhar|cheeni|साखर|चीनी"],
["jaggery","Jaggery","गूळ","misc","mh","tsp",5,19,0,4.8,0,0,0,VEG,2,"jaggery|gul|gud|गूळ|गुड"],
["honey","Honey","मध","misc","generic","tsp",7,21,0,5.7,0,0,0,VEG,3,"honey|madh|शहद|मध"],

// ——— Sweets ————————————————————————————————————————————————————————
["gulab_jamun","Gulab Jamun","गुलाबजाम","sweet","north","piece",40,150,2,22,6,0.2,3,VEG,1,"gulab jamun|gulabjam|गुलाबजाम|गुलाब जामुन"],
["jalebi","Jalebi","जिलेबी","sweet","north","piece",35,150,1,26,5,0,4,VEG,1,"jalebi|jilebi|जिलेबी"],
["modak_steamed","Ukadiche Modak","उकडीचे मोदक","sweet","mh","piece",40,120,1.8,20,3.8,1.2,1,VEG,3,"modak|ukadiche modak|steamed modak|मोदक|उकडीचे मोदक"],
["modak_fried","Fried Modak","तळणीचे मोदक","sweet","mh","piece",40,175,2,22,9,1.2,6,VEG,1,"fried modak|talniche modak|तळणीचे मोदक"],
["besan_laddu","Besan Laddu","बेसन लाडू","sweet","generic","piece",40,185,4,22,9,1.5,5,VEG,1,"besan laddu|laddu|ladoo|लाडू|बेसन लाडू"],
["rava_laddu","Rava Laddu","रवा लाडू","sweet","mh","piece",35,160,2.5,24,6.5,0.8,4,VEG,1,"rava laddu|रवा लाडू"],
["shrikhand","Shrikhand","श्रीखंड","sweet","mh","bowl",100,250,6,36,9,0,0,VEG,1,"shrikhand|shrikand|श्रीखंड|amrakhand|आम्रखंड"],
["basundi","Basundi","बासुंदी","sweet","mh","bowl",100,210,6,26,9,0,0,VEG,1,"basundi|बासुंदी|rabdi|रबडी"],
["kheer","Kheer","खीर","sweet","generic","bowl",150,250,6,38,8.5,0.5,0,VEG,2,"kheer|payasam|खीर|तांदळाची खीर"],
["barfi","Barfi","बर्फी","sweet","generic","piece",30,140,3,16,7,0.3,0,VEG,1,"barfi|burfi|बर्फी"],
["halwa","Halwa","हलवा","sweet","generic","bowl",100,300,4,42,13,1,9,VEG,1,"halwa|halva|हलवा|gajar halwa|गाजर हलवा"],
["ice_cream","Ice Cream","आईस्क्रीम","sweet","generic","bowl",100,200,3.5,24,10,0.5,0,VEG,1,"ice cream|icecream|आईस्क्रीम"],
["chocolate","Chocolate","चॉकलेट","sweet","generic","piece",20,105,1.5,12,6,1,0,VEG,1,"chocolate|चॉकलेट|dairy milk"],
["cake_slice","Cake slice","केक","sweet","generic","slice",80,300,4,42,13,1,0,VEG,1,"cake|pastry|केक|पेस्ट्री"]
];

/** Terms that legitimately map to several dishes — the app asks instead of guessing. */
export const AMBIGUOUS = {
  usal: ["matki_usal", "chana_usal", "moong_usal", "vatana_usal", "mixed_usal"],
  "उसळ": ["matki_usal", "chana_usal", "moong_usal", "vatana_usal", "mixed_usal"],
  bhaji: ["mixed_sabzi", "bhendi_bhaji", "batata_bhaji", "palak_bhaji", "kobi_bhaji"],
  "भाजी": ["mixed_sabzi", "bhendi_bhaji", "batata_bhaji", "palak_bhaji", "kobi_bhaji"],
  sabzi: ["mixed_sabzi", "bhendi_bhaji", "batata_bhaji", "gobi_bhaji"],
  dal: ["varan", "toor_dal", "moong_dal", "masoor_dal", "dal_fry"],
  "डाळ": ["varan", "toor_dal", "moong_dal", "masoor_dal"],
  bhakri: ["jowar_bhakri", "bajra_bhakri", "nachni_bhakri"],
  "भाकरी": ["jowar_bhakri", "bajra_bhakri", "nachni_bhakri"],
  curry: ["chicken_curry", "fish_curry", "egg_curry", "mixed_sabzi"],
  biryani: ["veg_biryani", "chicken_biryani", "egg_biryani", "mutton_biryani"],
  paratha: ["paratha_plain", "aloo_paratha", "methi_paratha", "paneer_paratha"],
  dosa: ["dosa_plain", "masala_dosa"],
  chutney: ["green_chutney", "coconut_chutney", "shengdana_chutney"],
  laddu: ["besan_laddu", "rava_laddu"],
  "लाडू": ["besan_laddu", "rava_laddu"]
};

/** Sensible default when a shared word is used casually and confidence is otherwise fine. */
export const DEFAULT_FOR = {
  bhakri: "jowar_bhakri", "भाकरी": "jowar_bhakri",
  dal: "varan", "डाळ": "varan", daal: "varan",
  bhaji: "mixed_sabzi", "भाजी": "mixed_sabzi", sabzi: "mixed_sabzi",
  usal: "mixed_usal", "उसळ": "mixed_usal",
  rice: "cooked_rice", "भात": "cooked_rice",
  paratha: "paratha_plain", dosa: "dosa_plain", biryani: "veg_biryani",
  chutney: "green_chutney", laddu: "besan_laddu"
};

export const CATEGORY_LABELS = {
  bread: "Breads & bhakri", rice: "Rice & grains", dal: "Dals & legumes",
  usal: "Usal & sprouts", sabzi: "Bhaji & sabzi", breakfast: "Breakfast",
  snack: "Snacks", street: "Street food", nonveg: "Chicken, fish & mutton",
  egg: "Eggs", dairy: "Dairy", fruit: "Fruits", salad: "Salads & vegetables",
  nuts: "Nuts & seeds", sweet: "Sweets", drink: "Drinks", fat: "Oils & fats",
  misc: "Condiments"
};

const KEYS = ["id", "name", "mr", "cat", "cuisine", "unit", "g", "kcal", "protein", "carbs", "fat", "fibre", "oilG", "diet", "heart", "aliasStr"];

function expand(row) {
  const food = {};
  KEYS.forEach((key, i) => { food[key] = row[i]; });
  food.aliases = food.aliasStr.split("|").map(a => a.trim()).filter(Boolean);
  delete food.aliasStr;
  food.veg = food.diet === 1;
  return food;
}

export const FOODS = [...ROWS, ...ROWS2].map(expand);
export const FOOD_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]));
