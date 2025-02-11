
prob_visitar = [0.25, 0.15, 0.05, 0.2, 0.1, 0.15, 0.1]
prob_carne = [0.45, 0.54, 0.6, 0.35, 0.23, 0.12, 0.8]

#a)
prob_visitar_2 = prob_visitar[2]
print(f"a) Probabilidad de visitar el supermercado con índice 2: {prob_visitar_2:.5f}")

#b)
prob_visitar_5_carne = prob_visitar[5] * prob_carne[5]
print(f"b) Probabilidad de visitar el supermercado con índice 5 y comprar carne: {prob_visitar_5_carne:.5f}")

#c)
prob_comprar_carne = sum(prob_visitar[i] * prob_carne[i] for i in range(7))
print(f"c) Probabilidad de que el compañero compre carne: {prob_comprar_carne:.5f}")

#d)
prob_visitar_3_carne = (prob_carne[3] * prob_visitar[3]) / prob_comprar_carne
print(f"d) Probabilidad de que visitó el supermercado con índice 3, dado que compró carne: {prob_visitar_3_carne:.5f}")

#e)
prob_no_comprar_carne = 1 - prob_comprar_carne
prob_visitar_1_no_carne = (prob_visitar[1] * (1 - prob_carne[1])) / prob_no_comprar_carne
prob_no_visitar_1_no_carne = 1 - prob_visitar_1_no_carne
print(f"e) Probabilidad de que no visite el supermercado con índice 1, dado que no compró carne: {prob_no_visitar_1_no_carne:.5f}")
