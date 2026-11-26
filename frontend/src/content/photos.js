// Photos réelles des destinations (licences libres, crédits obligatoires).
// Source et licence de chaque fichier : public/images/credits.json.
export const PHOTOS = {
  lisbonne: {
    src: "/images/lisbonne.jpg",
    city: "Lisbonne",
    place: "Alfama, le tram 28",
    alt: "Un tram jaune de la ligne 28 tourne devant une église blanche dans l'Alfama, à Lisbonne.",
    credit: "Jorge Cancela, CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Alfama_(8859841661).jpg",
  },
  rome: {
    src: "/images/rome.jpg",
    city: "Rome",
    place: "Trastevere, vicolo de' Cinque",
    alt: "Une ruelle pavée du Trastevere bordée de façades ocre aux volets bruns, à Rome.",
    credit: "Estormiz, CC0",
    source: "https://commons.wikimedia.org/wiki/File:Vicolo_de%27_Cinque_Rome_20130307.jpg",
  },
  istanbul: {
    src: "/images/istanbul.jpg",
    city: "Istanbul",
    place: "Beyoğlu, la tour de Galata",
    alt: "La tour de Galata en pierre, coiffée d'un toit conique, sous un ciel d'hiver à Istanbul.",
    credit: "Martin Falbisoner, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Galata_Tower_January_2015.JPG",
  },
  marrakech: {
    src: "/images/marrakech.jpg",
    city: "Marrakech",
    place: "Médina, souk Haddadine",
    alt: "Des dizaines de lanternes en métal ciselé allumées dans une échoppe du souk de Marrakech.",
    credit: "Petar Milošević, CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Oriental_hanging_lanterns._Souk_Haddadine,_Marrakech_Medina,_Morocco.jpg",
  },
  athenes: {
    src: "/images/athenes.jpg",
    city: "Athènes",
    place: "Plaka, sous l'Acropole",
    alt: "Un escalier de pierre entre des maisons ocre et des lauriers-roses dans la Plaka, à Athènes.",
    credit: "Laurens R. Krol, CC BY 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:2016-08-03_Greece,_Athens,_Plaka_DSC_9733_DxO_1.jpg",
  },
  paris: {
    src: "/images/paris.jpg",
    city: "Paris",
    place: "Montmartre, le Sacré-Cœur",
    alt: "La basilique du Sacré-Cœur blanche au sommet des escaliers de Montmartre, ciel bleu.",
    credit: "Terragio67, CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:L%27escalier_de_droite_menant_%C3%A0_la_Basilique_de_Montmartre_-_GT_03_-_2024.jpg",
  },
};

/** Photo d'une ville par son nom affiché ("Athènes" -> PHOTOS.athenes), ou undefined. */
export const photoForCity = (city) => Object.values(PHOTOS).find((p) => p.city === city);

/** Textures de la planète du récit (jour, nuit, nuages, océans) : pas des photos de destination. */
export const EARTH_CREDIT = {
  label: "Textures de la Terre : Solar System Scope, CC BY 4.0",
  source: "https://www.solarsystemscope.com/textures/",
};
