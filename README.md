# Facebook Group Post Queue

> Edukacyjne rozszerzenie Manifest V3 do zarządzania lokalną kolejką postów na Facebooku.

**Facebook Group Post Queue** to lokalne rozszerzenie dla Chrome i Edge. Pozwala przygotować kolejkę postów (tekst i opcjonalne zdjęcie), a następnie przejść przez wskazane grupy Facebooka zgodnie z ustaloną kolejnością.

> [!IMPORTANT]
> Projekt działa lokalnie w przeglądarce i korzysta z aktualnie zalogowanej sesji użytkownika. Nie wysyła haseł, ciasteczek ani treści postów na zewnętrzny serwer.

## Spis treści

- [Funkcje](#funkcje)
- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Użycie](#użycie)
- [Uprawnienia](#uprawnienia)
- [Cel edukacyjny](#cel-edukacyjny)
- [Rozwój](#rozwój)
- [Licencja](#licencja)

## Funkcje

- Kolejka wielu postów tekstowych.
- Opcjonalne zdjęcie przypisane do każdego posta.
- Obsługa wielu grup — jeden pełny adres grupy w każdym wierszu.
- Konfigurowany odstęp między kolejnymi publikacjami.
- Status działania kolejki i przycisk jej zatrzymania.
- Lokalne przechowywanie kolejki przez `chrome.storage.local`.

## Wymagania

- Google Chrome lub Microsoft Edge obsługujący rozszerzenia Manifest V3.
- Zalogowane konto Facebook.
- Prawo do publikowania w każdej wskazanej grupie.
- Stabilne połączenie z internetem.
- Otwarta karta Facebooka przez cały czas działania kolejki.

## Instalacja

1. Pobierz repozytorium jako ZIP albo je sklonuj:

   ```bash
   git clone https://github.com/fuzleer/Facebook-Group-Post-Queue.git
   ```

2. Otwórz stronę zarządzania rozszerzeniami:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Włącz **Tryb dewelopera**.
4. Wybierz **Załaduj rozpakowane**.
5. Wskaż folder projektu, czyli katalog zawierający plik `manifest.json`.
6. Opcjonalnie przypnij ikonę **Group Post Queue** do paska przeglądarki.

## Użycie

1. Otwórz panel rozszerzenia.
2. W polu adresów grup wklej pełne linki — po jednym w każdym wierszu.
3. Wpisz gotową treść posta i, jeśli chcesz, wybierz zdjęcie.
4. Kliknij **Dodaj do kolejki** i powtórz czynność dla następnych postów.
5. Ustaw odstęp między publikacjami; minimalna wartość to 30 sekund.
6. Kliknij **Rozpocznij publikowanie**.

Kolejka jest realizowana w następującej kolejności:

```text
post 1 → grupa 1 → grupa 2 → … → post 2 → grupa 1 → grupa 2 → …
```

> [!TIP]
> Nie zamykaj karty Facebooka podczas działania kolejki. Przycisk **Zatrzymaj** kończy działanie rozszerzenia po stronie przeglądarki.

## Uprawnienia

| Uprawnienie | Zastosowanie |
| --- | --- |
| `storage`, `unlimitedStorage` | Lokalne przechowywanie kolejki oraz wybranych obrazów. |
| `tabs` | Przejście do następnej grupy z kolejki. |
| `debugger` | Wysyłanie zdarzeń kliknięcia i klawiatury wymaganych przez interfejs Facebooka. |
| Dostęp do `facebook.com` | Działanie skryptu wyłącznie na stronie Facebooka. |

## Cel edukacyjny

Projekt ma charakter edukacyjny. Służy do nauki:

- tworzenia rozszerzeń przeglądarki w Manifest V3;
- komunikacji między popupem, service workerem i content scriptem;
- lokalnego przechowywania danych w rozszerzeniu;
- automatyzacji powtarzalnych interakcji w interfejsie WWW.

> [!WARNING]
> Używaj projektu wyłącznie na własnych zasobach albo za wyraźną zgodą administratorów grup. Narzędzie nie jest przeznaczone do masowego spamu, obchodzenia zabezpieczeń, omijania limitów ani naruszania regulaminów serwisów. Za sposób użycia odpowiada użytkownik.

## Rozwój

Projekt nie ma zależności zewnętrznych ani kroku budowania. Po zmianach w plikach:

1. Otwórz `chrome://extensions`.
2. Kliknij **Odśwież** przy rozszerzeniu.
3. Odśwież otwartą kartę Facebooka.

Plik [`content.js`](content.js) zawiera selektory interfejsu Facebooka i jest najbardziej podatny na zmiany po aktualizacjach strony.

Wskazówki dla osób współtworzących projekt są w pliku [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencja

Projekt jest udostępniony na licencji [MIT](LICENSE).
