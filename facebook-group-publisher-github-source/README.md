# Facebook Group Post Queue

Lokalne rozszerzenie dla Chrome i Edge, które tworzy kolejkę gotowych postów (tekst + opcjonalne zdjęcie) oraz publikuje je kolejno na wskazanych grupach Facebooka.

> Projekt działa wyłącznie w przeglądarce użytkownika, na jego zalogowanej sesji. Nie przesyła haseł, ciasteczek ani treści postów na zewnętrzny serwer.

## Funkcje

- kolejka wielu postów tekstowych;
- opcjonalne zdjęcie dla każdego posta;
- wiele grup, po jednym adresie w każdym wierszu;
- ustawiany odstęp między publikacjami;
- bieżący status oraz możliwość zatrzymania kolejki;
- przechowywanie kolejki lokalnie w `chrome.storage.local`.

## Instalacja

1. Pobierz lub sklonuj repozytorium.
2. Otwórz `chrome://extensions` (Edge: `edge://extensions`).
3. Włącz **Tryb dewelopera**.
4. Kliknij **Załaduj rozpakowane** i wybierz katalog tego projektu.
5. Przypnij ikonę **Group Post Queue** do paska przeglądarki.

## Użycie

1. W polu adresów wklej pełne adresy grup Facebooka — jeden w każdym wierszu.
2. Dodaj tekst, opcjonalnie zdjęcie, a następnie kliknij **Dodaj do kolejki**. Powtórz dla każdego posta.
3. Ustaw odstęp między publikacjami (minimum 30 sekund).
4. Kliknij **Rozpocznij publikowanie**.

Kolejność pracy wygląda tak:

```text
post 1 → grupa 1 → grupa 2 → … → post 2 → grupa 1 → grupa 2 → …
```

Nie zamykaj karty Facebooka podczas działania kolejki. Przycisk **Zatrzymaj** przerywa działanie po stronie rozszerzenia.

## Uprawnienia

| Uprawnienie | Dlaczego jest potrzebne |
| --- | --- |
| `storage`, `unlimitedStorage` | lokalne przechowanie kolejki i obrazów |
| `tabs` | przejście do kolejnej grupy |
| `debugger` | wysyłanie zdarzeń kliknięcia/klawiatury akceptowanych przez interfejs Facebooka |
| dostęp do `facebook.com` | działanie skryptu wyłącznie na stronie Facebooka |

## Rozwój

Projekt nie ma zależności ani kroku budowania. Po zmianie plików otwórz `chrome://extensions`, kliknij **Odśwież** przy rozszerzeniu, a potem odśwież kartę Facebooka.

Najbardziej podatny na zmiany Facebooka jest plik `content.js`, który zawiera selektory interfejsu tworzenia posta.

## Odpowiedzialne użycie

Korzystaj wyłącznie w grupach, w których masz prawo publikować, i zgodnie z zasadami Meta oraz regulaminami grup. Automatyzacja powinna wspierać własną, uprawnioną pracę — nie spam ani omijanie ograniczeń platformy.

## Licencja

Projekt jest udostępniony na licencji MIT. Szczegóły w pliku [LICENSE](LICENSE).
