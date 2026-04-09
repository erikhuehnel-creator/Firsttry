// ============================================================================
// PROFIFLORA – Produktkatalog
// Alle Sortimente aus den Filialdaten. Admin kann diese über die
// Sortiment-Verwaltung im Dashboard anpassen.
// ============================================================================

const DEFAULT_CATALOG = {

  // ── SCHNITTBESTELLUNG ────────────────────────────────────────────────────
  schnitt: {
    label: 'Schnittbestellung',
    categories: [
      {
        name: 'Schnittblumen',
        items: [
          { id: 'S001', name: 'Amaryllis',                    ve: 'Stk',  vk: 3.99 },
          { id: 'S002', name: 'Akeleiranunkel',               ve: 'Stk',  vk: 2.49 },
          { id: 'S003', name: 'Allium / Zierlauch',           ve: 'Stk',  vk: 1.89 },
          { id: 'S004', name: 'Anthurien',                    ve: 'Stk',  vk: 3.49 },
          { id: 'S005', name: 'Astilbe',                      ve: 'Bund', vk: 2.99 },
          { id: 'S006', name: 'Celosia Torero',               ve: 'Stk',  vk: 1.99 },
          { id: 'S007', name: 'Chrysanthemen 5 grün',         ve: 'Stk',  vk: 1.49 },
          { id: 'S008', name: 'Chrysanthemen 5 gelb',         ve: 'Stk',  vk: 1.49 },
          { id: 'S009', name: 'Cosmea / Schmuckblume',        ve: 'Bund', vk: 2.49 },
          { id: 'S010', name: 'Craspedia / Trommelstöcke',    ve: 'Bund', vk: 2.99 },
          { id: 'S011', name: 'Carthamus',                    ve: 'Bund', vk: 2.49 },
          { id: 'S012', name: 'Gard Mix Variation in Folge',  ve: 'Stk',  vk: 1.99 },
          { id: 'S013', name: 'Hyperikum',                    ve: 'Bund', vk: 2.99 },
          { id: 'S014', name: 'Lathyrus (diverse Farben)',    ve: 'Bund', vk: 2.49 },
          { id: 'S015', name: 'Lilien',                       ve: 'Stk',  vk: 2.99 },
          { id: 'S016', name: 'Lisianthus',                   ve: 'Stk',  vk: 2.49 },
          { id: 'S017', name: 'Matricaria extra',             ve: 'Bund', vk: 1.99 },
          { id: 'S018', name: 'Nelken',                       ve: 'Bund', vk: 1.99 },
          { id: 'S019', name: 'Phlox',                        ve: 'Bund', vk: 2.49 },
          { id: 'S020', name: 'Protea',                       ve: 'Stk',  vk: 4.99 },
          { id: 'S021', name: 'Ranunkel',                     ve: 'Stk',  vk: 1.99 },
          { id: 'S022', name: 'Veronica',                     ve: 'Bund', vk: 2.49 },
          { id: 'S023', name: 'Wachsblume',                   ve: 'Bund', vk: 2.99 },
        ]
      },
      {
        name: 'Rosen',
        items: [
          { id: 'S100', name: 'Rosen Diva rot/weiß',         ve: 'Stk',  vk: 1.99 },
          { id: 'S101', name: 'Rosen rot 50cm',              ve: 'Stk',  vk: 1.99 },
          { id: 'S102', name: 'Rosen rot 60cm',              ve: 'Stk',  vk: 2.49 },
          { id: 'S103', name: 'Rosen rosa 50cm',             ve: 'Stk',  vk: 1.99 },
          { id: 'S104', name: 'Rosen weiß 50cm',             ve: 'Stk',  vk: 1.99 },
          { id: 'S105', name: 'Rosen gelb 50cm',             ve: 'Stk',  vk: 1.99 },
          { id: 'S106', name: 'Rosen pink 50cm',             ve: 'Stk',  vk: 1.99 },
          { id: 'S107', name: 'Rosen lachs 50cm',            ve: 'Stk',  vk: 1.99 },
          { id: 'S108', name: 'Rosen mix/bunt',              ve: 'Stk',  vk: 1.99 },
          { id: 'S109', name: 'Rosen orange 50cm',           ve: 'Stk',  vk: 1.99 },
          { id: 'S110', name: 'Rosen creme 50cm',            ve: 'Stk',  vk: 1.99 },
          { id: 'S111', name: 'Rosen Rambler / Spray',       ve: 'Stk',  vk: 2.49 },
        ]
      },
      {
        name: 'Gerbera',
        items: [
          { id: 'S200', name: 'Gerbera diverse Farben',      ve: 'Stk',  vk: 1.49 },
          { id: 'S201', name: 'Gerbera mini bunt',           ve: 'Stk',  vk: 1.29 },
          { id: 'S202', name: 'Gerbera rot',                 ve: 'Stk',  vk: 1.49 },
          { id: 'S203', name: 'Gerbera gelb',                ve: 'Stk',  vk: 1.49 },
          { id: 'S204', name: 'Gerbera rosa',                ve: 'Stk',  vk: 1.49 },
          { id: 'S205', name: 'Gerbera orange',              ve: 'Stk',  vk: 1.49 },
          { id: 'S206', name: 'Gerbera weiß',                ve: 'Stk',  vk: 1.49 },
        ]
      },
      {
        name: 'Grünzeug / Binderei',
        items: [
          { id: 'S300', name: 'Asparagus',                   ve: 'Bund', vk: 2.49 },
          { id: 'S301', name: 'Choco Bund',                  ve: 'Bund', vk: 2.99 },
          { id: 'S302', name: 'Pistazie',                    ve: 'Bund', vk: 2.99 },
          { id: 'S303', name: 'Patrizia',                    ve: 'Bund', vk: 2.99 },
          { id: 'S304', name: 'Spinosa Pack',                ve: 'Pack', vk: 3.99 },
          { id: 'S305', name: 'Aralia Junior 50cm',          ve: 'Stk',  vk: 1.49 },
          { id: 'S306', name: 'Aralia Super 80cm',           ve: 'Stk',  vk: 2.49 },
          { id: 'S307', name: 'Blatt Sprich Fach',           ve: 'Stk',  vk: 1.99 },
          { id: 'S308', name: 'Schleierkraut',               ve: 'Bund', vk: 2.99 },
          { id: 'S309', name: 'Eukalyptus',                  ve: 'Bund', vk: 3.49 },
          { id: 'S310', name: 'Salal',                       ve: 'Bund', vk: 2.49 },
        ]
      },
      {
        name: 'Trauer',
        items: [
          { id: 'S400', name: 'Trauer Binset (14+Bd)',       ve: 'Stk',  vk: 2.99 },
          { id: 'S401', name: 'Veronica / Cosmea',           ve: 'Stk',  vk: 2.49 },
          { id: 'S402', name: 'Iris',                        ve: 'Stk',  vk: 1.99 },
        ]
      },
      {
        name: 'Topfpflanzen (Schnitt)',
        items: [
          { id: 'S500', name: 'Chrysanthemen Topf',          ve: 'Kiste', vk: 4.99 },
          { id: 'S501', name: 'Kalanchoe mini rosa gefüllt', ve: 'Stk',   vk: 2.49 },
          { id: 'S502', name: 'Primeln',                     ve: 'Stk',   vk: 1.49 },
          { id: 'S503', name: 'Phalaenopsis',                ve: 'Stk',   vk: 12.99 },
        ]
      }
    ]
  },

  // ── LANDGARD BESTELLUNG ──────────────────────────────────────────────────
  landgard: {
    label: 'Landgard Bestellung',
    categories: [
      {
        name: 'Zimmerpflanzen',
        items: [
          { id: 'L001', name: 'Anthurium andreanum rot',      ve: 'Stk', vk: 8.99,  topf: '12' },
          { id: 'L002', name: 'Anthurium andreanum weiß',     ve: 'Stk', vk: 8.99,  topf: '12' },
          { id: 'L003', name: 'Anthurium andreanum pink',     ve: 'Stk', vk: 8.99,  topf: '12' },
          { id: 'L004', name: 'Bromelie',                     ve: 'Stk', vk: 7.99,  topf: '12' },
          { id: 'L005', name: 'Strelitzie',                   ve: 'Stk', vk: 14.99, topf: '14' },
          { id: 'L006', name: 'Dracena',                      ve: 'Stk', vk: 6.99,  topf: '12' },
          { id: 'L007', name: 'Campanula',                    ve: 'Stk', vk: 3.99,  topf: '10.5' },
          { id: 'L008', name: 'Kalanchoe',                    ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L009', name: 'Primel',                       ve: 'Stk', vk: 1.49,  topf: '10.5' },
          { id: 'L010', name: 'Poinsettia grandiflorum',      ve: 'Stk', vk: 5.99,  topf: '12' },
          { id: 'L011', name: 'Chrysantheme Topf',            ve: 'Stk', vk: 4.99,  topf: '12' },
          { id: 'L012', name: 'Crassula',                     ve: 'Stk', vk: 4.99,  topf: '10.5' },
          { id: 'L013', name: 'Phalaenopsis',                 ve: 'Stk', vk: 12.99, topf: '12' },
          { id: 'L014', name: 'Phalaenopsis 2-Trieber',       ve: 'Stk', vk: 19.99, topf: '12' },
          { id: 'L015', name: 'Exacum affine',                ve: 'Stk', vk: 3.99,  topf: '10.5' },
          { id: 'L016', name: 'Dianthus barbathus',           ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L017', name: 'Dianthus caryophyllus',        ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L018', name: 'Dianthus spez.',               ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L019', name: 'Dianthus spez. Rosetti',       ve: 'Stk', vk: 3.49,  topf: '10.5' },
          { id: 'L020', name: 'Euonymus',                     ve: 'Stk', vk: 4.99,  topf: '12' },
          { id: 'L021', name: 'Cassiflora Mischung',          ve: 'Stk', vk: 4.99,  topf: '12' },
        ]
      },
      {
        name: 'Grünpflanzen',
        items: [
          { id: 'L100', name: 'Fatsja',                       ve: 'Stk', vk: 5.99,  topf: '12' },
          { id: 'L101', name: 'Hedera',                       ve: 'Stk', vk: 3.99,  topf: '10.5' },
          { id: 'L102', name: 'Schefflera',                   ve: 'Stk', vk: 5.99,  topf: '12' },
          { id: 'L103', name: 'Hydra Stamm 60-80',            ve: 'Stk', vk: 14.99, topf: '14' },
          { id: 'L104', name: 'Cina-enne',                    ve: 'Stk', vk: 4.99,  topf: '12' },
          { id: 'L105', name: 'Ficus',                        ve: 'Stk', vk: 7.99,  topf: '14' },
          { id: 'L106', name: 'Hedera in Sorte',              ve: 'Stk', vk: 3.49,  topf: '10.5' },
          { id: 'L107', name: 'Schefflera in Ost (top)',      ve: 'Stk', vk: 6.99,  topf: '14' },
          { id: 'L108', name: 'Palme Stamm 60-80',            ve: 'Stk', vk: 14.99, topf: '14' },
          { id: 'L109', name: 'Grünpflanzen Mix Moos',        ve: 'Stk', vk: 5.99,  topf: '12' },
        ]
      },
      {
        name: 'Gartenpflanzen / Outdoor',
        items: [
          { id: 'L200', name: 'Fuchsien balia',               ve: 'Stk', vk: 3.99,  topf: '12' },
          { id: 'L201', name: 'Heide / Calluna',              ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L202', name: 'Hyazinthen Mischung 7-Zwiebel',ve: 'Stk', vk: 5.99,  topf: '14' },
          { id: 'L203', name: 'Hydrangea macrophylla',        ve: 'Stk', vk: 8.99,  topf: '14' },
          { id: 'L204', name: 'Kürbis deko',                  ve: 'Stk', vk: 3.99,  topf: '' },
          { id: 'L205', name: 'Muscaria',                     ve: 'Stk', vk: 2.49,  topf: '10.5' },
          { id: 'L206', name: 'Myosotis',                     ve: 'Stk', vk: 1.99,  topf: '10.5' },
          { id: 'L207', name: 'Narzissen großblumig',         ve: 'Stk', vk: 2.49,  topf: '10.5' },
          { id: 'L208', name: 'Narzissen kleinblumig',        ve: 'Stk', vk: 1.99,  topf: '10.5' },
          { id: 'L209', name: 'Pelargonium zonale',           ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L210', name: 'Pelargonium jungle',           ve: 'Stk', vk: 3.49,  topf: '10.5' },
          { id: 'L211', name: 'Topfrose blix',                ve: 'Stk', vk: 4.99,  topf: '12' },
          { id: 'L212', name: 'Physalis',                     ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L213', name: 'Phlox multicalia',             ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L214', name: 'Ranunkel',                     ve: 'Stk', vk: 2.49,  topf: '10.5' },
          { id: 'L215', name: 'Senecio',                      ve: 'Stk', vk: 2.49,  topf: '10.5' },
          { id: 'L216', name: 'Sempervivum',                  ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L217', name: 'Azalee',                       ve: 'Stk', vk: 5.99,  topf: '12' },
          { id: 'L218', name: 'Cyclame',                      ve: 'Stk', vk: 3.99,  topf: '10.5' },
          { id: 'L219', name: 'Erica',                        ve: 'Stk', vk: 2.49,  topf: '10.5' },
          { id: 'L220', name: 'Viola F1 in Farben',           ve: 'Stk', vk: 1.29,  topf: '10.5' },
          { id: 'L221', name: 'Lavendel blau',                ve: 'Stk', vk: 2.99,  topf: '12' },
          { id: 'L222', name: 'Lavendel rosa',                ve: 'Stk', vk: 2.99,  topf: '12' },
          { id: 'L223', name: 'Hortensie im Topf',            ve: 'Stk', vk: 8.99,  topf: '14' },
          { id: 'L224', name: 'Rosenstämmchen',               ve: 'Stk', vk: 12.99, topf: '14' },
          { id: 'L225', name: 'Päonien / Pfingstrosen',       ve: 'Stk', vk: 6.99,  topf: '12' },
        ]
      },
      {
        name: 'Saisonware',
        items: [
          { id: 'L300', name: 'Tomaten cocktail / Frucht',    ve: 'Stk', vk: 3.99,  topf: '12' },
          { id: 'L301', name: 'Calamondin / Kalat',           ve: 'Stk', vk: 5.99,  topf: '12' },
          { id: 'L302', name: 'Tandom / Sausleria',           ve: 'Stk', vk: 3.99,  topf: '10.5' },
          { id: 'L303', name: 'Maiblumen Mix',                ve: 'Stk', vk: 4.99,  topf: '12' },
          { id: 'L304', name: 'Bents Schellenbergblume',      ve: 'Stk', vk: 2.99,  topf: '10.5' },
          { id: 'L305', name: 'Kürbis deko klein',            ve: 'Stk', vk: 1.99,  topf: '' },
        ]
      },
      {
        name: 'Blumensträuße & Gestecke',
        items: [
          { id: 'L400', name: 'Blumensträuße klein (Garden)', ve: 'Stk', vk: 7.99,  topf: '' },
          { id: 'L401', name: 'Blumensträuße groß',           ve: 'Stk', vk: 14.99, topf: '' },
          { id: 'L402', name: 'Blumengestecke',               ve: 'Stk', vk: 12.99, topf: '' },
          { id: 'L403', name: 'Blumenordnungen',              ve: 'Stk', vk: 9.99,  topf: '' },
        ]
      },
      {
        name: 'Blumenerde & Dünger',
        items: [
          { id: 'L500', name: 'Blumenerde Floragard',         ve: 'Sack', vk: 5.99,  topf: '' },
          { id: 'L501', name: 'Blumenerde Kakteen',           ve: 'Sack', vk: 4.99,  topf: '' },
          { id: 'L502', name: 'Blumenerde Ein-Topf',          ve: 'Sack', vk: 3.99,  topf: '' },
          { id: 'L503', name: 'Dünger Universal',             ve: 'Stk',  vk: 4.99,  topf: '' },
          { id: 'L504', name: 'Dünger Orchideen',             ve: 'Stk',  vk: 4.99,  topf: '' },
          { id: 'L505', name: 'Dünger Grünpflanzen',          ve: 'Stk',  vk: 4.99,  topf: '' },
        ]
      },
      {
        name: 'Sonstiges',
        items: [
          { id: 'L600', name: 'Furken amesstol',              ve: 'Stk', vk: 1.99,  topf: '' },
          { id: 'L601', name: 'Tulpe / Narcose',              ve: 'Stk', vk: 1.99,  topf: '' },
          { id: 'L602', name: 'Grubpflanzen',                 ve: 'Stk', vk: 3.99,  topf: '12' },
        ]
      }
    ]
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.DEFAULT_CATALOG = DEFAULT_CATALOG;
}
