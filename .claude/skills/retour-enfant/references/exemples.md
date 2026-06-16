# Exemples de retours d'enfant → action → confirmation

Pour calibrer le ton et l'enchaînement. Le **comment** technique reste invisible
pour l'enfant.

| Retour (mots d'enfant) | Type | Pipeline | Confirmation (mots d'enfant) |
| --- | --- | --- | --- |
| « Le cheval bouge pas quand je lui donne à manger » | 🐛 bug / ✨ anim | test-debug puis (si voulu) anim « Nourrir » → release-deploy | « C'est réparé ! Maintenant ton cheval baisse la tête pour manger. 🔄 Rafraîchis ! » |
| « Je veux des papillons dans la forêt » | ✨ déco | asset-search (vérif) → asset-add → add-decor-item → map-verify → release-deploy | « J'ai ajouté des papillons 🦋 ! Va voir près des arbres. » |
| « Je veux un cheval tout rose » | ✨ robe | asset-search (vérif) → asset-add → add-horse-coat → test-debug → release-deploy | « Tu peux choisir une jolie robe rose pour ton cheval maintenant ! » |
| « Les lettres s'écrivent pas quand je tape un nom » | 🐛 bug | test-debug (repro→cause→fix→non-régression) → release-deploy | « C'est réparé ! Tu peux écrire tous les noms que tu veux. » |
| « Je veux gagner des étoiles quand je m'occupe des chevaux » | ✨ feature | coder objectifs → state-migration → test-debug → release-deploy | « Bravo ! Maintenant tu gagnes des étoiles ⭐ quand tu prends soin de tes chevaux ! » |

## Une seule question (si vraiment nécessaire), en mots d'enfant
- « Tu veux que le cheval mange une 🍎 pomme ou du 🌾 foin ? »
- « Les papillons, tu les veux de quelle couleur : jaune ou bleu ? »

## Si ça ne marche pas
« Je n'ai pas réussi cette fois, papa pourra regarder. » *(et laisser le détail
technique dans l'issue GitHub pour l'adulte.)*
