# Integració amb Meteocat

## Descripció

S'ha integrat el **Servei Meteorològic de Catalunya (Meteocat)** com a font de dades meteorològiques oficial per a Sant Pere Pescador.

## Característiques

### Dades obtingudes de Meteocat:
- **Temperatura**: Temperatura actual i previsions
- **Vent**: Velocitat del vent (convertida a nusos per compatibilitat amb navegació)
- **Ratxes de vent**: Ratxes màximes de vent
- **Direcció del vent**: Direcció en graus (0-360)
- **Precipitació**: Acumulació de precipitació
- **Humitat**: Humitat relativa (quan està disponible)

### Estació meteorològica utilitzada:
- **Estació**: Roses (CG)
- **Ubicació**: La més propera a Sant Pere Pescador
- **Coordenades**: 42.1833°N, 3.0833°E

## Implementació tècnica

### Arxius creats/modificats:

1. **`lib/meteocat-api.ts`**: Nou mòdul amb la integració de Meteocat
   - Classe `MeteocatProvider` amb mètodes per obtenir dades actuals i prediccions
   - Funció `getMeteocatForecast()` per obtenir prediccions processades
   - Processament de dades de l'API de Meteocat

2. **`lib/weather-apis.ts`**: Actualitzat per incloure Meteocat
   - Nova classe `MeteocatWeatherProvider` que implementa la interfaz `WeatherProvider`
   - Meteocat afegit com a proveïdor amb **prioritat 0** (màxima prioritat)

3. **`lib/api.ts`**: Modificat per provar Meteocat primer
   - Primer intent: Meteocat (dades oficials de Catalunya)
   - Segon intent: Open-Meteo (dades globals gratuïtes)
   - Tercer intent: Sistema protegit amb dades simulades

4. **`components/api-status.tsx`**: Actualitzat per mostrar l'estat de Meteocat
   - Verificació de disponibilitat de Meteocat
   - Mostra "Meteocat (Oficial Catalunya)" quan està actiu

5. **`components/weather-sources.tsx`**: Nou component per mostrar totes les fonts
   - Llista totes les fonts de dades disponibles
   - Mostra l'estat de cada font (disponible/no disponible)
   - Indica la prioritat de cada font

## API de Meteocat utilitzada

### Endpoints:

1. **Estacions meteorològiques**:
   ```
   GET https://api.meteo.cat/xema/v1/estacions/CG
   ```
   Obtenir informació sobre l'estació de Roses

2. **Variables mesurades**:
   ```
   GET https://api.meteo.cat/xema/v1/estacions/CG/variables/mesurades?estat=ope
   ```
   Obtenir dades meteorològiques actuals de l'estació

3. **Predicció municipal**:
   ```
   GET https://api.meteo.cat/prediccio/v1/municipal/170138
   ```
   Obtenir predicció per Sant Pere Pescador (codi municipi: 170138)

### Variables meteorològiques:

| Codi | Variable | Unitat | Conversió |
|------|----------|--------|-----------|
| 32 | Temperatura | °C | - |
| 30 | Humitat relativa | % | - |
| 35 | Velocitat del vent | m/s | × 1.944 = nusos |
| 36 | Direcció del vent | graus | - |
| 81 | Ratxa màxima de vent | m/s | × 1.944 = nusos |

## Avantatges d'utilitzar Meteocat

1. **Dades oficials**: Font governamental oficial de Catalunya
2. **Alta precisió local**: Dades específiques per la zona de l'Alt Empordà
3. **Prioritat màxima**: S'utilitza primer quan està disponible
4. **Gratuït**: API pública sense necessitat de claus d'API
5. **Alta confiança**: Confiança del 95% assignada a les dades de Meteocat

## Prioritat de fonts de dades

El sistema utilitza les fonts en aquest ordre de prioritat:

1. **Meteocat** (prioritat 0) - Dades oficials de Catalunya
2. **Open-Meteo** (prioritat 1) - Dades globals gratuïtes
3. **WeatherAPI** (prioritat 2) - Servei comercial (requereix API key)
4. **OpenWeatherMap** (prioritat 3) - Servei comercial (requereix API key)
5. **Dades simulades** - Sistema de fallback si totes les fonts fallen

## Com utilitzar-ho

La integració és automàtica i transparent. El sistema:

1. Intenta obtenir dades de Meteocat
2. Si Meteocat no està disponible, prova altres fonts
3. Mostra l'estat de la font utilitzada al component `ApiStatus`
4. El component `WeatherSources` mostra totes les fonts disponibles

## Futur desenvolupament

Possibles millores:

- [ ] Integrar més estacions properes per dades més precises
- [ ] Utilitzar dades horàries de Meteocat si estan disponibles
- [ ] Afegir alertes meteorològiques de Meteocat
- [ ] Mostrar historial de dades de Meteocat
- [ ] Integrar mapes de radar i imatges de satèl·lit de Meteocat

## Referències

- [Documentació oficial de l'API de Meteocat](https://apidocs.meteocat.gencat.cat/)
- [Portal de dades obertes de Meteocat](https://www.meteo.cat/wpweb/serveis/cataleg-de-serveis/dades-obertes/)
