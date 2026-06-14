export const categoriasSemente = [
  'Ração para cachorro',
  'Ração para gato',
  'Petiscos',
  'Higiene',
  'Acessórios',
  'Agropecuária',
  'Jardinagem',
  'Farmácia pet',
  'Brinquedos',
  'Aves e roedores'
] as const

export type CategoriaSemente = (typeof categoriasSemente)[number]

export type ProdutoSemente = {
  nome: string
  descricao: string
  categoria: CategoriaSemente
  marca: string
  precoCentavos: number
  estoque: number
  peso: string
  imagemUrl: string
  destaque: boolean
  promocao: boolean
  ativo: boolean
}

type DadosProdutoSemente = Omit<
  ProdutoSemente,
  'imagemUrl' | 'destaque' | 'promocao' | 'ativo'
> &
  Partial<Pick<ProdutoSemente, 'imagemUrl' | 'destaque' | 'promocao' | 'ativo'>>

const imagensProdutoSemente = {
  'Ração Golden Adulto 15kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1106741/racao-golden-special-para-caes-adultos-frango-e-carne-15-1.webp?v=639159071953570000',
  'Ração Premier Raças Pequenas 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1082753/Racao-Premier-Formula-Caes-Adultos-Racas-Pequenas-Frango-1kg-frente.webp?v=638906218514600000',
  'Ração Special Dog Carne 15kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1107317/Racao%20Special%20Dog%20Ultralife%20Performance%20Caes%20Adultos%20Carne%20e%20Frango%20embalagem.webp?v=639161069495800000',
  'Ração GranPlus Adulto Frango 15kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/985181/racao-gran-plus-adulto-frango-e-arroz-frente.jpg?v=637903165131000000',
  'Ração Pedigree Adulto Carne 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1095417/Racao%20Pedigree%20Nutri%20Essencial%20Caes%20Adultos%20Carne.webp?v=639033272559000000',
  'Ração Dog Chow Filhotes 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1050725/racao-dog-chow-filhote-frango-arroz-10kg-frente.png?v=638313489479300000',
  'Ração Fórmula Natural Senior 7kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1102679/Racao%20Formula%20Natural%20Pro%20Caes%20Senior%20MD_GD.webp?v=639142152963970000',
  'Ração Úmida Sachê Cães 100g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1065188/0-Racao-Umida-Optimum-Sache-Caes-Filhotes-Frango.png?v=638803140352830000',
  'Ração Premier Gatos 10kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1082792/Racao-Premier-Formula-Gatos-Castrados-Salmao-1.5kg-frente.webp?v=638906284054330000',
  'Ração Whiskas Adulto Carne 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1064732/0-WHISKAS-ADULTO-CARNE-2kg.png?v=638838887956370000',
  'Ração Golden Gatos Castrados 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1106782/racao-golden-gatos-castrados-sabor-salmao-1-1.webp?v=639159186057970000',
  'Ração GranPlus Gatos Filhotes 10,1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1037578/Filhote-Frango-Arroz-frente.jpg?v=638127726940170000',
  'Ração Fórmula Natural Gatos 7kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1057942/FN-LIFE-GATO-CAST-SALMAO-LTR-ESQ.png?v=638866519572900000',
  'Sachê Whiskas Frango 85g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1051150/Racao-Umida-Whiskas-Sache-Frango-ao-Molho-Gatos-Adultos.png?v=638322007768230000',
  'Sachê Gatos Castrados Salmão 85g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1060980/Racao-Umida-Optimum-Sache-Gatos-Adultos-Castrados-Salmao-85g.png?v=638802276517000000',
  'Biscoito canino 500g':
    'https://cobasi.vteximg.com.br/arquivos/ids/225665/Biscoito_Keldog_Crok_Integral.jpg?v=636990713182270000',
  'Osso Nó Natural 3 unidades':
    'https://cobasi.vteximg.com.br/arquivos/ids/1092581/Joy%20Osso%20Femur%20Suino%20Desidratado.webp?v=638993232692500000',
  'Palito Dental Cães 180g':
    'https://cobasi.vteximg.com.br/arquivos/ids/350138/Palito_Dental_Stiks_Dingo_3771384.jpg?v=638869905213400000',
  'Bifinho Carne 500g':
    'https://cobasi.vteximg.com.br/arquivos/ids/806437/Petisco-8in1-Bifinho-Filhote-Carne-Prebiotico-Soro-de-Leite-55g-871567.jpg?v=638328179089030000',
  'Petisco Gatos Sabor Frango 40g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1095478/Hero_Petisco%20Dreamies%20Frango%20para%20Gatos.webp?v=639033972183600000',
  'Snack Treinamento Cães 300g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1052615/Petisco-Minibifinhos-Carne-treinamento-Carne.png?v=638760230951200000',
  'Casco Bovino Defumado Unidade':
    'https://cobasi.vteximg.com.br/arquivos/ids/1070359/Petisco-Casco-Bovino-Natural-Farm-Bacon-e-Queijo-6-unidades.webp.webp?v=638802567317200000',
  'Areia higiênica 4kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1076182/Carecat-Perfumada-4kg.webp?v=638944965392130000',
  'Areia Sílica Cristal 1,8kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1084815/Areia%20Silica%20MyHug%20Micro%20Cristais%201.8kg.webp?v=638944234818900000',
  'Tapete Higiênico 30 unidades':
    'https://cobasi.vteximg.com.br/arquivos/ids/1097005/super-secao-tapete-higienico-para-cachorro-30uni.webp?v=639070184812500000',
  'Shampoo Neutro Pet 500ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/1054244/Shampoo-Neutro-Beeps-Pet-Society-500ml.png?v=638457693130330000',
  'Condicionador Pelos Longos 500ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/1080920/condicionador-ultra-revitalizante-neutrodor-petmais-1.webp?v=638882727067570000',
  'Eliminador de Odores 2L':
    'https://cobasi.vteximg.com.br/arquivos/ids/1068243/Eliminador-Odores-Original-Sanol.png.png?v=638754159487800000',
  'Lenço Umedecido Pet 75 unidades':
    'https://cobasi.vteximg.com.br/arquivos/ids/1047232/lenco-umedecido-para-gato-pet-clean-1.png?v=638947494084200000',
  'Pá Coletora Higiênica':
    'https://cobasi.vteximg.com.br/arquivos/ids/1058070/Pa-Coletora-Cabo-1.png?v=638544038687700000',
  'Coleira regulável':
    'https://cobasi.vteximg.com.br/arquivos/ids/804521/Coleira-Geometric-sao-Pet.jpg?v=638842294109000000',
  'Guia Nylon Reforçada 1,2m':
    'https://cobasi.vteximg.com.br/arquivos/ids/1081678/Guia-Dupla-Toh-Preta-para-Caes-e-Gatos.webp?v=638893086685970000',
  'Peitoral Ajustável Médio':
    'https://cobasi.vteximg.com.br/arquivos/ids/1098432/Peitoral-Air-Mesh-Ajustavel-para-Caes-Zeedog-Honey.webp?v=639098064022700000',
  'Comedouro Inox 900ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/193509/Comedouro-Gatos-Inox-Jambo-1.jpg?v=638164104906700000',
  'Bebedouro Automático 2L':
    'https://cobasi.vteximg.com.br/arquivos/ids/267816/praticao.jpg?v=638844770618930000',
  'Caixa de Transporte N2':
    'https://cobasi.vteximg.com.br/arquivos/ids/1059102/caixa-de-transporte-panther-rosa.png?v=638569970396670000',
  'Caminha Retangular P':
    'https://cobasi.vteximg.com.br/arquivos/ids/1092230/Cama-Retangular-Carmel-Fabrica-Pet-Rosa.webp?v=638989844216170000',
  'Escova Rasqueadeira Média':
    'https://cobasi.vteximg.com.br/arquivos/ids/1061429/rasqueadeira-ringo-m.png?v=638622675926030000',
  'Semente de milho 1kg': 'https://loremflickr.com/640/640/corn-seed?lock=601',
  'Milho Triturado 20kg': 'https://loremflickr.com/640/640/cracked-corn?lock=602',
  'Ração Galinha Postura 20kg': 'https://loremflickr.com/640/640/chicken-feed?lock=603',
  'Sal Mineral Bovino 25kg':
    'https://upload.wikimedia.org/wikipedia/commons/1/1f/Salt_lick_-_geograph.org.uk_-_646473.jpg',
  'Farelo de Trigo 20kg': 'https://loremflickr.com/640/640/wheat-bran?lock=604',
  'Feno Prensado 5kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1097752/Feno%20Premium%20Belas%20Aves%20e%20Roedores%20500g.webp?v=639078071120130000',
  'Pulverizador Manual 5L':
    'https://cobasi.vteximg.com.br/arquivos/ids/1058379/Pulverizador-Plastico-Manual-Tramontina.png?v=638545941248500000',
  'Balde Plástico Reforçado 12L':
    'https://cobasi.vteximg.com.br/arquivos/ids/775658/balde-plastico-sanremo-l.jpg?v=638151732057200000',
  'Terra vegetal 20kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/783903/terra-vegetal-biomix-2kg.jpg?v=638132793672200000',
  'Substrato para Orquídeas 2kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1050455/Substrato-para-Orquideas-Terral.png?v=638307461264500000',
  'Adubo NPK 10-10-10 1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/181421/Fertilizante-10-10-10-5kg-Dimy.jpg?v=638155174454570000',
  'Húmus de Minhoca 5kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/787226/humus-de-minhoca-campo-e-flores-2kg.jpg?v=638157729797730000',
  'Vaso Plástico N3':
    'https://cobasi.vteximg.com.br/arquivos/ids/208872/Vaso-Terracota-Preto-Nutriplan-3.jpg?v=636857641172500000',
  'Regador Plástico 5L':
    'https://cobasi.vteximg.com.br/arquivos/ids/1051469/Regador-Plastico-com-Chuveiro-Regaplan.png?v=638337517228400000',
  'Semente de Alface 100g':
    'https://cobasi.vteximg.com.br/arquivos/ids/826955/595586.jpg?v=638351557866470000',
  'Kit Ferramentas Jardim 3 peças':
    'https://cobasi.vteximg.com.br/arquivos/ids/1102307/Conjunto%20para%20Jardinagem%20Tramontina%201.webp?v=639137782141730000',
  'Antipulgas Cães 10 a 20kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1068384/Bravecto-Caes-Transdermal-500mg-2.png?v=638756780319400000',
  'Vermífugo Cães e Gatos 4 comprimidos':
    'https://cobasi.vteximg.com.br/arquivos/ids/910807/vermifugo-mebendazole-vetnil-10-comprimidos.jpg?v=638538773886900000',
  'Suplemento Vitamínico Pet 60ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/947145/7898053580623.jpg?v=638133847807170000',
  'Limpador Auricular 100ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/1081910/Phisioderm-Limpador-Auricular.webp.webp?v=638893967249900000',
  'Spray Cicatrizante Pet 50ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/1062199/Kuraderm-Prata-100-ml.png?v=638636397797330000',
  'Probiótico Pet 14g':
    'https://cobasi.vteximg.com.br/arquivos/ids/191835/Microlac_2.jpg?v=638133858037500000',
  'Bola Maciça Borracha P':
    'https://cobasi.vteximg.com.br/arquivos/ids/1062978/bola-borracha-macica-mini-tudo-pet-vermelho-5.png?v=638660791563370000',
  'Mordedor Corda Dupla':
    'https://cobasi.vteximg.com.br/arquivos/ids/1052929/Mordedor-Corda-Pattern-Dupla-Jambo.png?v=638417014413330000',
  'Arranhador Papelão Gatos':
    'https://cobasi.vteximg.com.br/arquivos/ids/207224/Arranhador-de-Chao-Furacao-Pet-1.jpg?v=638127604060100000',
  'Varinha Gatos com Pena':
    'https://cobasi.vteximg.com.br/arquivos/ids/1105600/Varinha-para-Gatos-Pelucia-e-Pena-Flicks.webp?v=639154243289030000',
  'Pelúcia Resistente Cães':
    'https://cobasi.vteximg.com.br/arquivos/ids/1052926/Pelucia-Pig-Fofo-Rosa-Jambo.png?v=638417010138700000',
  'Disco Flexível Pet':
    'https://cobasi.vteximg.com.br/arquivos/ids/1093629/Brinquedo-Fresbee-Disco-Voador-Stark-Pet-Verde.webp?v=639008221028470000',
  'Mistura para Canário 500g':
    'https://cobasi.vteximg.com.br/arquivos/ids/178984/Mistura-para-Canario-Dan-Real---500-g.jpg?v=635978845124600000',
  'Alpiste Premium 1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/178977/Alpiste-500g-Dan-Real.jpg?v=638133805297430000',
  'Ração para Calopsita 500g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1067903/Racao-Megazoo-Mix-Calopsitas--1-.png.png?v=638820637126900000',
  'Ração Coelho 1kg':
    'https://cobasi.vteximg.com.br/arquivos/ids/1023262/7898329490250.jpg?v=638022983603770000',
  'Serragem Prensada 800g':
    'https://cobasi.vteximg.com.br/arquivos/ids/1063552/Serragem-Prensada-Animalissimo.jpg?v=638665902175970000',
  'Bebedouro Hamster 120ml':
    'https://cobasi.vteximg.com.br/arquivos/ids/182524/Bebedouro-Plastico-para-Hamster-100ml.jpg?v=636077153804700000'
} as const

function imagemProduto(nome: string) {
  const imagemUrl = imagensProdutoSemente[nome as keyof typeof imagensProdutoSemente]

  if (!imagemUrl) {
    throw new Error(`Imagem nao cadastrada para o produto "${nome}".`)
  }

  return imagemUrl
}

function produto(dados: DadosProdutoSemente): ProdutoSemente {
  const imagemUrl = dados.imagemUrl ?? imagemProduto(dados.nome)

  return {
    destaque: false,
    promocao: false,
    ativo: true,
    ...dados,
    imagemUrl
  }
}

export const produtosSemente: ProdutoSemente[] = [
  produto({
    nome: 'Ração Golden Adulto 15kg',
    descricao: 'Ração seca para cães adultos de porte médio.',
    categoria: 'Ração para cachorro',
    marca: 'Golden',
    precoCentavos: 16990,
    estoque: 18,
    peso: '15kg',
    destaque: true
  }),
  produto({
    nome: 'Ração Premier Raças Pequenas 10,1kg',
    descricao: 'Alimento premium para cães adultos de raças pequenas.',
    categoria: 'Ração para cachorro',
    marca: 'Premier',
    precoCentavos: 21490,
    estoque: 10,
    peso: '10,1kg',
    destaque: true
  }),
  produto({
    nome: 'Ração Special Dog Carne 15kg',
    descricao: 'Ração para cães adultos com sabor carne.',
    categoria: 'Ração para cachorro',
    marca: 'Special Dog',
    precoCentavos: 13990,
    estoque: 22,
    peso: '15kg',
    promocao: true
  }),
  produto({
    nome: 'Ração GranPlus Adulto Frango 15kg',
    descricao: 'Ração para cães adultos com frango e arroz.',
    categoria: 'Ração para cachorro',
    marca: 'GranPlus',
    precoCentavos: 18490,
    estoque: 14,
    peso: '15kg'
  }),
  produto({
    nome: 'Ração Pedigree Adulto Carne 10,1kg',
    descricao: 'Ração completa para cães adultos.',
    categoria: 'Ração para cachorro',
    marca: 'Pedigree',
    precoCentavos: 12990,
    estoque: 16,
    peso: '10,1kg'
  }),
  produto({
    nome: 'Ração Dog Chow Filhotes 10,1kg',
    descricao: 'Alimento para filhotes com proteína e cálcio.',
    categoria: 'Ração para cachorro',
    marca: 'Dog Chow',
    precoCentavos: 15490,
    estoque: 13,
    peso: '10,1kg'
  }),
  produto({
    nome: 'Ração Fórmula Natural Senior 7kg',
    descricao: 'Ração para cães idosos com ingredientes selecionados.',
    categoria: 'Ração para cachorro',
    marca: 'Fórmula Natural',
    precoCentavos: 19990,
    estoque: 8,
    peso: '7kg'
  }),
  produto({
    nome: 'Ração Úmida Sachê Cães 100g',
    descricao: 'Sachê úmido para cães adultos.',
    categoria: 'Ração para cachorro',
    marca: 'Fazendinha Pet',
    precoCentavos: 690,
    estoque: 80,
    peso: '100g',
    promocao: true
  }),
  produto({
    nome: 'Ração Premier Gatos 10kg',
    descricao: 'Alimento para gatos adultos com alta aceitação.',
    categoria: 'Ração para gato',
    marca: 'Premier',
    precoCentavos: 18990,
    estoque: 12,
    peso: '10kg',
    destaque: true
  }),
  produto({
    nome: 'Ração Whiskas Adulto Carne 10,1kg',
    descricao: 'Ração seca para gatos adultos sabor carne.',
    categoria: 'Ração para gato',
    marca: 'Whiskas',
    precoCentavos: 16990,
    estoque: 17,
    peso: '10,1kg'
  }),
  produto({
    nome: 'Ração Golden Gatos Castrados 10,1kg',
    descricao: 'Alimento para gatos castrados adultos.',
    categoria: 'Ração para gato',
    marca: 'Golden',
    precoCentavos: 17990,
    estoque: 15,
    peso: '10,1kg',
    destaque: true
  }),
  produto({
    nome: 'Ração GranPlus Gatos Filhotes 10,1kg',
    descricao: 'Ração para gatos filhotes com DHA.',
    categoria: 'Ração para gato',
    marca: 'GranPlus',
    precoCentavos: 18490,
    estoque: 9,
    peso: '10,1kg'
  }),
  produto({
    nome: 'Ração Fórmula Natural Gatos 7kg',
    descricao: 'Ração para gatos adultos com ingredientes naturais.',
    categoria: 'Ração para gato',
    marca: 'Fórmula Natural',
    precoCentavos: 21990,
    estoque: 7,
    peso: '7kg'
  }),
  produto({
    nome: 'Sachê Whiskas Frango 85g',
    descricao: 'Alimento úmido para gatos sabor frango.',
    categoria: 'Ração para gato',
    marca: 'Whiskas',
    precoCentavos: 490,
    estoque: 120,
    peso: '85g',
    promocao: true
  }),
  produto({
    nome: 'Sachê Gatos Castrados Salmão 85g',
    descricao: 'Sachê para gatos castrados sabor salmão.',
    categoria: 'Ração para gato',
    marca: 'Fazendinha Pet',
    precoCentavos: 590,
    estoque: 95,
    peso: '85g'
  }),
  produto({
    nome: 'Biscoito canino 500g',
    descricao: 'Petisco crocante para treino e recompensa.',
    categoria: 'Petiscos',
    marca: 'Doguitos',
    precoCentavos: 1890,
    estoque: 30,
    peso: '500g'
  }),
  produto({
    nome: 'Osso Nó Natural 3 unidades',
    descricao: 'Ossos naturais para cães mastigarem.',
    categoria: 'Petiscos',
    marca: 'Pet Treats',
    precoCentavos: 2190,
    estoque: 24,
    peso: '3 unidades'
  }),
  produto({
    nome: 'Palito Dental Cães 180g',
    descricao: 'Petisco dental para auxiliar na higiene oral.',
    categoria: 'Petiscos',
    marca: 'DentalPet',
    precoCentavos: 2490,
    estoque: 32,
    peso: '180g',
    promocao: true
  }),
  produto({
    nome: 'Bifinho Carne 500g',
    descricao: 'Bifinho macio para cães sabor carne.',
    categoria: 'Petiscos',
    marca: 'Keldog',
    precoCentavos: 2790,
    estoque: 26,
    peso: '500g'
  }),
  produto({
    nome: 'Petisco Gatos Sabor Frango 40g',
    descricao: 'Snack para gatos em embalagem prática.',
    categoria: 'Petiscos',
    marca: 'Cat Licious',
    precoCentavos: 990,
    estoque: 42,
    peso: '40g'
  }),
  produto({
    nome: 'Snack Treinamento Cães 300g',
    descricao: 'Petisco pequeno para adestramento e passeios.',
    categoria: 'Petiscos',
    marca: 'Fazendinha Pet',
    precoCentavos: 2290,
    estoque: 28,
    peso: '300g'
  }),
  produto({
    nome: 'Casco Bovino Defumado Unidade',
    descricao: 'Petisco natural defumado para cães.',
    categoria: 'Petiscos',
    marca: 'Natural Pet',
    precoCentavos: 1290,
    estoque: 45,
    peso: 'unidade'
  }),
  produto({
    nome: 'Areia higiênica 4kg',
    descricao: 'Areia granulada para gatos, pacote econômico.',
    categoria: 'Higiene',
    marca: 'Pipicat',
    precoCentavos: 2990,
    estoque: 34,
    peso: '4kg',
    promocao: true
  }),
  produto({
    nome: 'Areia Sílica Cristal 1,8kg',
    descricao: 'Areia de sílica com alto controle de odor.',
    categoria: 'Higiene',
    marca: 'Chalesco',
    precoCentavos: 4490,
    estoque: 20,
    peso: '1,8kg'
  }),
  produto({
    nome: 'Tapete Higiênico 30 unidades',
    descricao: 'Tapete absorvente para cães filhotes e adultos.',
    categoria: 'Higiene',
    marca: 'SuperSecão',
    precoCentavos: 5990,
    estoque: 18,
    peso: '30 unidades',
    destaque: true
  }),
  produto({
    nome: 'Shampoo Neutro Pet 500ml',
    descricao: 'Shampoo neutro para banho de cães e gatos.',
    categoria: 'Higiene',
    marca: 'Pet Clean',
    precoCentavos: 2490,
    estoque: 36,
    peso: '500ml'
  }),
  produto({
    nome: 'Condicionador Pelos Longos 500ml',
    descricao: 'Condicionador para desembaraçar pelos longos.',
    categoria: 'Higiene',
    marca: 'Pet Clean',
    precoCentavos: 2690,
    estoque: 22,
    peso: '500ml'
  }),
  produto({
    nome: 'Eliminador de Odores 2L',
    descricao: 'Produto para limpeza de ambientes com pets.',
    categoria: 'Higiene',
    marca: 'Sanol',
    precoCentavos: 3290,
    estoque: 25,
    peso: '2L'
  }),
  produto({
    nome: 'Lenço Umedecido Pet 75 unidades',
    descricao: 'Lenços para limpeza rápida de patas e pelos.',
    categoria: 'Higiene',
    marca: 'Fazendinha Pet',
    precoCentavos: 1990,
    estoque: 40,
    peso: '75 unidades'
  }),
  produto({
    nome: 'Pá Coletora Higiênica',
    descricao: 'Pá plástica para limpeza de caixas de areia.',
    categoria: 'Higiene',
    marca: 'Plaspet',
    precoCentavos: 890,
    estoque: 50,
    peso: 'unidade'
  }),
  produto({
    nome: 'Coleira regulável',
    descricao: 'Coleira resistente para cães de pequeno e médio porte.',
    categoria: 'Acessórios',
    marca: 'Fazendinha',
    precoCentavos: 2490,
    estoque: 24,
    peso: 'unidade'
  }),
  produto({
    nome: 'Guia Nylon Reforçada 1,2m',
    descricao: 'Guia de nylon com mosquetão metálico.',
    categoria: 'Acessórios',
    marca: 'Fazendinha',
    precoCentavos: 2990,
    estoque: 30,
    peso: '1,2m'
  }),
  produto({
    nome: 'Peitoral Ajustável Médio',
    descricao: 'Peitoral acolchoado para passeio seguro.',
    categoria: 'Acessórios',
    marca: 'Pet Walk',
    precoCentavos: 6990,
    estoque: 14,
    peso: 'unidade',
    destaque: true
  }),
  produto({
    nome: 'Comedouro Inox 900ml',
    descricao: 'Comedouro em aço inox para água ou ração.',
    categoria: 'Acessórios',
    marca: 'InoxPet',
    precoCentavos: 3490,
    estoque: 35,
    peso: '900ml'
  }),
  produto({
    nome: 'Bebedouro Automático 2L',
    descricao: 'Bebedouro automático com reservatório transparente.',
    categoria: 'Acessórios',
    marca: 'Plaspet',
    precoCentavos: 4490,
    estoque: 16,
    peso: '2L'
  }),
  produto({
    nome: 'Caixa de Transporte N2',
    descricao: 'Caixa de transporte para gatos e cães pequenos.',
    categoria: 'Acessórios',
    marca: 'Pet Box',
    precoCentavos: 11990,
    estoque: 8,
    peso: 'nº 2'
  }),
  produto({
    nome: 'Caminha Retangular P',
    descricao: 'Caminha acolchoada para pets pequenos.',
    categoria: 'Acessórios',
    marca: 'Sono Pet',
    precoCentavos: 8990,
    estoque: 11,
    peso: 'P',
    promocao: true
  }),
  produto({
    nome: 'Escova Rasqueadeira Média',
    descricao: 'Escova para remoção de pelos soltos.',
    categoria: 'Acessórios',
    marca: 'Pet Groom',
    precoCentavos: 2590,
    estoque: 20,
    peso: 'unidade'
  }),
  produto({
    nome: 'Semente de milho 1kg',
    descricao: 'Sementes selecionadas para plantio rural.',
    categoria: 'Agropecuária',
    marca: 'Campo Bom',
    precoCentavos: 1590,
    estoque: 42,
    peso: '1kg'
  }),
  produto({
    nome: 'Milho Triturado 20kg',
    descricao: 'Milho triturado para alimentação animal.',
    categoria: 'Agropecuária',
    marca: 'Campo Bom',
    precoCentavos: 5890,
    estoque: 20,
    peso: '20kg'
  }),
  produto({
    nome: 'Ração Galinha Postura 20kg',
    descricao: 'Ração balanceada para galinhas poedeiras.',
    categoria: 'Agropecuária',
    marca: 'NutriCampo',
    precoCentavos: 7690,
    estoque: 18,
    peso: '20kg',
    destaque: true
  }),
  produto({
    nome: 'Sal Mineral Bovino 25kg',
    descricao: 'Suplemento mineral para bovinos.',
    categoria: 'Agropecuária',
    marca: 'BoviSal',
    precoCentavos: 8990,
    estoque: 12,
    peso: '25kg'
  }),
  produto({
    nome: 'Farelo de Trigo 20kg',
    descricao: 'Farelo para complemento alimentar animal.',
    categoria: 'Agropecuária',
    marca: 'Campo Bom',
    precoCentavos: 5290,
    estoque: 16,
    peso: '20kg'
  }),
  produto({
    nome: 'Feno Prensado 5kg',
    descricao: 'Feno seco prensado para pequenos animais.',
    categoria: 'Agropecuária',
    marca: 'Sítio Verde',
    precoCentavos: 3490,
    estoque: 26,
    peso: '5kg'
  }),
  produto({
    nome: 'Pulverizador Manual 5L',
    descricao: 'Pulverizador para jardim, horta e uso rural.',
    categoria: 'Agropecuária',
    marca: 'Brudden',
    precoCentavos: 7990,
    estoque: 10,
    peso: '5L'
  }),
  produto({
    nome: 'Balde Plástico Reforçado 12L',
    descricao: 'Balde multiuso reforçado para rotina rural.',
    categoria: 'Agropecuária',
    marca: 'Plasvale',
    precoCentavos: 2490,
    estoque: 28,
    peso: '12L'
  }),
  produto({
    nome: 'Terra vegetal 20kg',
    descricao: 'Substrato pronto para hortas, vasos e jardins.',
    categoria: 'Jardinagem',
    marca: 'Verde Vida',
    precoCentavos: 2290,
    estoque: 25,
    peso: '20kg',
    promocao: true
  }),
  produto({
    nome: 'Substrato para Orquídeas 2kg',
    descricao: 'Substrato leve para cultivo de orquídeas.',
    categoria: 'Jardinagem',
    marca: 'Verde Vida',
    precoCentavos: 1890,
    estoque: 32,
    peso: '2kg'
  }),
  produto({
    nome: 'Adubo NPK 10-10-10 1kg',
    descricao: 'Adubo granulado para plantas ornamentais e horta.',
    categoria: 'Jardinagem',
    marca: 'Vitaplan',
    precoCentavos: 2190,
    estoque: 38,
    peso: '1kg'
  }),
  produto({
    nome: 'Húmus de Minhoca 5kg',
    descricao: 'Adubo orgânico para vasos e canteiros.',
    categoria: 'Jardinagem',
    marca: 'Terra Boa',
    precoCentavos: 2490,
    estoque: 27,
    peso: '5kg'
  }),
  produto({
    nome: 'Vaso Plástico N3',
    descricao: 'Vaso plástico resistente para plantas médias.',
    categoria: 'Jardinagem',
    marca: 'Plasgarden',
    precoCentavos: 1290,
    estoque: 60,
    peso: 'unidade'
  }),
  produto({
    nome: 'Regador Plástico 5L',
    descricao: 'Regador leve para jardim e horta.',
    categoria: 'Jardinagem',
    marca: 'Plasgarden',
    precoCentavos: 2990,
    estoque: 18,
    peso: '5L'
  }),
  produto({
    nome: 'Semente de Alface 100g',
    descricao: 'Sementes para horta doméstica.',
    categoria: 'Jardinagem',
    marca: 'Isla',
    precoCentavos: 990,
    estoque: 44,
    peso: '100g'
  }),
  produto({
    nome: 'Kit Ferramentas Jardim 3 peças',
    descricao: 'Kit com pazinha, ancinho e transplantador.',
    categoria: 'Jardinagem',
    marca: 'Tramontina',
    precoCentavos: 5490,
    estoque: 13,
    peso: '3 peças',
    destaque: true
  }),
  produto({
    nome: 'Antipulgas Cães 10 a 20kg',
    descricao: 'Antipulgas tópico para cães de porte médio.',
    categoria: 'Farmácia pet',
    marca: 'Frontline',
    precoCentavos: 7490,
    estoque: 16,
    peso: 'unidade',
    destaque: true
  }),
  produto({
    nome: 'Vermífugo Cães e Gatos 4 comprimidos',
    descricao: 'Vermífugo de amplo espectro para pets.',
    categoria: 'Farmácia pet',
    marca: 'Vetnil',
    precoCentavos: 3990,
    estoque: 22,
    peso: '4 comprimidos'
  }),
  produto({
    nome: 'Suplemento Vitamínico Pet 60ml',
    descricao: 'Suplemento líquido para cães e gatos.',
    categoria: 'Farmácia pet',
    marca: 'Organnact',
    precoCentavos: 3490,
    estoque: 18,
    peso: '60ml'
  }),
  produto({
    nome: 'Limpador Auricular 100ml',
    descricao: 'Solução para limpeza de orelhas de cães e gatos.',
    categoria: 'Farmácia pet',
    marca: 'Pet Clean',
    precoCentavos: 2990,
    estoque: 20,
    peso: '100ml'
  }),
  produto({
    nome: 'Spray Cicatrizante Pet 50ml',
    descricao: 'Spray auxiliar para cuidados com a pele do pet.',
    categoria: 'Farmácia pet',
    marca: 'Vetnil',
    precoCentavos: 4590,
    estoque: 12,
    peso: '50ml'
  }),
  produto({
    nome: 'Probiótico Pet 14g',
    descricao: 'Probiótico para suporte intestinal de cães e gatos.',
    categoria: 'Farmácia pet',
    marca: 'Biovet',
    precoCentavos: 2890,
    estoque: 24,
    peso: '14g',
    promocao: true
  }),
  produto({
    nome: 'Bola Maciça Borracha P',
    descricao: 'Bola resistente para cães pequenos.',
    categoria: 'Brinquedos',
    marca: 'Furacão Pet',
    precoCentavos: 1990,
    estoque: 35,
    peso: 'P'
  }),
  produto({
    nome: 'Mordedor Corda Dupla',
    descricao: 'Mordedor de corda para brincadeiras de tração.',
    categoria: 'Brinquedos',
    marca: 'Chalesco',
    precoCentavos: 2490,
    estoque: 28,
    peso: 'unidade'
  }),
  produto({
    nome: 'Arranhador Papelão Gatos',
    descricao: 'Arranhador de papelão com catnip.',
    categoria: 'Brinquedos',
    marca: 'Cat Play',
    precoCentavos: 4990,
    estoque: 14,
    peso: 'unidade',
    destaque: true
  }),
  produto({
    nome: 'Varinha Gatos com Pena',
    descricao: 'Brinquedo interativo para gatos.',
    categoria: 'Brinquedos',
    marca: 'Cat Play',
    precoCentavos: 1690,
    estoque: 38,
    peso: 'unidade'
  }),
  produto({
    nome: 'Pelúcia Resistente Cães',
    descricao: 'Brinquedo de pelúcia reforçada para cães.',
    categoria: 'Brinquedos',
    marca: 'Fazendinha Pet',
    precoCentavos: 3990,
    estoque: 19,
    peso: 'unidade'
  }),
  produto({
    nome: 'Disco Flexível Pet',
    descricao: 'Disco flexível para brincadeiras ao ar livre.',
    categoria: 'Brinquedos',
    marca: 'Pet Games',
    precoCentavos: 2990,
    estoque: 23,
    peso: 'unidade'
  }),
  produto({
    nome: 'Mistura para Canário 500g',
    descricao: 'Mistura de sementes para canários.',
    categoria: 'Aves e roedores',
    marca: 'NutriAves',
    precoCentavos: 1290,
    estoque: 45,
    peso: '500g'
  }),
  produto({
    nome: 'Alpiste Premium 1kg',
    descricao: 'Alpiste selecionado para aves.',
    categoria: 'Aves e roedores',
    marca: 'NutriAves',
    precoCentavos: 1890,
    estoque: 40,
    peso: '1kg'
  }),
  produto({
    nome: 'Ração para Calopsita 500g',
    descricao: 'Ração extrusada para calopsitas.',
    categoria: 'Aves e roedores',
    marca: 'MegaZoo',
    precoCentavos: 2490,
    estoque: 24,
    peso: '500g',
    destaque: true
  }),
  produto({
    nome: 'Ração Coelho 1kg',
    descricao: 'Alimento completo para coelhos.',
    categoria: 'Aves e roedores',
    marca: 'Nutrópica',
    precoCentavos: 2990,
    estoque: 22,
    peso: '1kg'
  }),
  produto({
    nome: 'Serragem Prensada 800g',
    descricao: 'Forração para gaiolas de pequenos animais.',
    categoria: 'Aves e roedores',
    marca: 'Maravalha Pet',
    precoCentavos: 1490,
    estoque: 36,
    peso: '800g'
  }),
  produto({
    nome: 'Bebedouro Hamster 120ml',
    descricao: 'Bebedouro com bico metálico para roedores.',
    categoria: 'Aves e roedores',
    marca: 'Chalesco',
    precoCentavos: 1990,
    estoque: 18,
    peso: '120ml'
  })
]
