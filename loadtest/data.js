// Datos reales del catálogo (sacados del sitemap.xml público en vivo el
// 2026-09, sin tocar Firestore) para que la carga se reparta como
// tráfico real y no le pegue siempre a la misma URL. Si el catálogo
// cambia mucho, basta con volver a generar esta lista con:
//
//   curl -s https://www.moonbeautyval.com/sitemap.xml \
//     | grep -oP '(?<=<loc>)[^<]+/products/\K[^<]+'

export const CATEGORIAS = [
	'Contornos de ojos',
	'Cremas Faciales',
	'Cuidado capilar',
	'Cuidado Corporal',
	'Kits',
	'Limpiadores Faciales',
	'Maquillaje y Accesorios',
	'Mascarillas Faciales',
	'Protector solar',
	'Serums o Ampollas',
	'Suplementos',
	'Tonicos'
];

export const PRODUCT_IDS = [
	'0GJ7WCWLCHvisN1gqEuo', '0KlHrfiPQxZ5c5DpIY8D', '0zgZa1gOOMH0U4BhSzjb', '1', '10', '12', '13',
	'14', '1hG3Vhfqgw8sjezbIvUf', '29bPbccbTwTgvZa7JO4U', '29nhSrP4GhNh27fKcr5j', '3',
	'3mg0i7nWqaZw3i0Ska7J', '3mwDMfrMtUS34ozu7EN2', '4', '5', '6ASmXbBigBHdR7trgLg7',
	'6ZsTWjI26HBznC6p38EM', '7', '7DUzhmKfaM99FM564WTS', '7nkKdzilYKzxSSbFvCop', '9',
	'9SaFx8L7bg4rf41xjzA4', '9ttpK1YiaSF8tNDe2M2Q', 'AjApDNxlFk7pfmjBzAqA', 'BQC73KXghmE4rgPWtgnl',
	'Bw86nJW4cCtS1SrUOShg', 'CduhjQE73doiRIUO6w7C', 'CjYVuu4i0KhPh6g6TWHB', 'FClE1ugRHIMInSMjzays',
	'FlzPTBPyeMMgKpVjZNYY', 'GKtZF2HwsMIWFHxxX9Ye', 'GPV7IHHsOvzOMg72Zbbn', 'HdZ36imITkCeFyOzeUL0',
	'HjlpWEJqgfUfgph89E9l', 'IKsAZM1xNraj6aDg4YDp', 'JAi7uO5HSSeDov7yZjTT', 'K3KtPslI6ULkwu1Y0ueP',
	'KjdmPRStp5hYyPyn5Wdv', 'N5KXTLrGDZ9Jyd7TVXow', 'O7VqdvmM0AIYlVtwpcq0', 'OCLddqZGb0V54XD96HWD',
	'OLjMeAmLCdOn1mcmROYv', 'OOpbOHIr2BaqUjTzHQJW', 'PV8ycXbnd8fWk8pmI1vT', 'QImTOBorN2i8bxouQGuJ',
	'QLVgs3laCH12NlYIEgBQ', 'QdpFkzaigcgiUC2vwZkE', 'QsuamYqmInVGewiFN0q5', 'Sp4umofUowF7CxyMkLut',
	'T8xTIW5mgIpzkV4dI4SD', 'UBsQksoH8gvRxgJPUJy0', 'V8EpNP6eoAetlO2el5C7', 'VJarqTRTMK3hTkmLnGKP',
	'VO4vdJTYog0B75Spsago', 'VlwyCJyiXu7eyS2BB3Uo', 'VycX24FpYK7xXfDOODAM', 'Wgec1LnorMPD3Pjd9iZ8',
	'Xt0HXKQuTxWa9FBjXix6', 'YZ4Ih8Tii0UNesASD58Z', 'Yy9WLCni7qr3qCbhDi9n', 'ZmbsNnxOLKNNGNC3RMSe',
	'aejxDaF32FYr6YebnpVE', 'bPwiboeYX3et5O5s0jt9', 'bVrrt1EgmymQ94lrVyY4', 'cUZZFM9WOCiUD66HnJ7H',
	'dMg4AxzmF0DRR4MSXJq7', 'eapRsA86bsvrkgaWEGfY', 'esb1HBfpOiJjvqu5Mwwk', 'f1RBmZPgnDnZdAhnVFfg',
	'f1roHgkqCmgCJQ80raVQ', 'gW64dChslnCJH9gBM1pm', 'gf7vVCJeTlpHAO5zZtKt', 'ghHCdXfP40BkeguvoZ2o',
	'hmk80QTxsD9qOVBKQxLZ', 'i39nSty6ezUjx8Z5E8Gs', 'iE4MlxWmSbEqHWPrpHPB', 'iIzoml2gZgdy6LwApLTC',
	'jDgb2lxBflQFwzc6f0AN', 'jQGhofSZtNkjvJdHFZCE', 'jrc3U2jdRzgwxWsuuCnO', 'kmbZ7cADipZEm49gv9d1',
	'lczKaSa80MMBhdYDB584', 'nFcTNX3rlKLNbDL0QPXx', 'nL18IX8dq5TOUbOziPBB', 'nxGPdixGE5zImkNUpOXr',
	'o3RPLenT6YmIUlihn6yw', 'omBUsEUE9kfKzH7Cc1Fi', 'p1OGARH1wW83X5ZPHsxk', 'pa1XcmQfzXSpO5sVJvMF',
	'pbZrUpejonjcRenJiLqD', 'pxiGAen69MO4RoSvAUy2', 'q59mFgIousDkZnItx2ZC', 'qOEZvukkZOLx1dnQArkz',
	'rIbEPQE7O4GyX8yAjco4', 'rsWDPRRC1twM4qsYTnVJ', 'rz2EBiKbJo1p8uolk6rX', 'srL7Deb4Yq30gNGt6qCR',
	'ty9cexvq6XvKTQ1Sibeb', 'uDE3yUrm0YTLbL5aj3Nq', 'uM3EAySFqgFQdk45WXIe', 'uPwNyYIMoLfRrooVHJ0U',
	'uUfPH3c5rkyDzPob0U5u', 'vsl0rS3bUSV9kvkftwz5', 'w4bGv40RNEdnK73m60U1', 'xIVkOB4xUV5Of51xLlLO',
	'xYNgtibDKqG361aSeezU', 'yBDFYd89drc8EnEva5Qm'
];

export function elegirAlAzar(lista) {
	return lista[Math.floor(Math.random() * lista.length)];
}
