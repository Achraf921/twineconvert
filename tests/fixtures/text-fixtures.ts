/**
 * Text-based fixtures for testing converters that accept text formats.
 * Each fixture is a real, valid (if minimal) example of its format.
 */

export const FIXTURES = {
  // Tab-separated values
  tsv: `name\tage\tcity
Alice\t30\tParis
Bob\t25\tLondon
Carol\t35\tTokyo
`,

  // Generic XML with attributes and nested elements
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1">
    <title>The First Book</title>
    <author>Alice Smith</author>
    <year>2020</year>
  </book>
  <book id="2">
    <title>Another Book</title>
    <author>Bob Jones</author>
    <year>2022</year>
  </book>
</library>
`,

  // Markdown with headings, list, code block, link, emphasis
  markdown: `# Sample Document

This is a **markdown** document with *emphasis*.

## Features

- First item
- Second item
- Third item

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

Visit [example.com](https://example.com) for more.
`,

  // YAML 1.2 with nested objects and arrays
  yaml: `name: Alice
age: 30
roles:
  - admin
  - editor
config:
  theme: dark
  notifications: true
`,

  // TOML 1.0 with a top-level table and a nested one
  toml: `name = "Alice"
age = 30
roles = ["admin", "editor"]

[config]
theme = "dark"
notifications = true
`,

  // SRT with two cues
  srt: `1
00:00:01,000 --> 00:00:04,000
First caption text

2
00:00:05,500 --> 00:00:08,250
Second caption
spanning two lines
`,

  // WebVTT with two cues
  vtt: `WEBVTT

00:00:01.000 --> 00:00:04.000
First caption text

00:00:05.500 --> 00:00:08.250
Second caption
spanning two lines
`,

  // CSV with bank-style transaction columns (auto-detected by finance-csv util)
  bankCsv: `Date,Description,Amount
2024-03-15,Coffee Shop,-4.50
2024-03-16,Salary Deposit,2500.00
2024-03-17,Grocery Store,-87.32
`,

  // Generic CSV with header row
  genericCsv: `name,age,city
Alice,30,Paris
Bob,25,London
Carol,35,Tokyo
`,

  // JSON array (for json-to-csv etc.)
  jsonArray: `[
  {"name":"Alice","age":30},
  {"name":"Bob","age":25}
]`,

  // BibTeX entry
  bibtex: `@article{smith2024,
  author = {Smith, John and Doe, Jane},
  title = {A Sample Paper},
  journal = {Nature},
  year = {2024},
  volume = {123},
  pages = {45--67},
  doi = {10.1038/sample.2024.001},
}
`,

  // RIS citation
  ris: `TY  - JOUR
AU  - Smith, John
AU  - Doe, Jane
TI  - A Sample Paper
JO  - Nature
PY  - 2024
VL  - 123
SP  - 45
EP  - 67
DO  - 10.1038/sample.2024.001
ER  -
`,

  // NBIB (PubMed format), same as RIS structurally. PT (Publication
  // Type) is what triggers PubMed record detection in our parser
  // (mapped to RIS TY tag via NBIB_TO_RIS table).
  nbib: `PMID- 12345678
PT  - Journal Article
TI  - PubMed Sample Paper
AU  - Researcher A
JT  - Journal of Tests
DP  - 2024
VI  - 5
IP  - 2
PG  - 100-110
AID - 10.1038/test.2024.001
ER  -
`,

  // EndNote XML
  endnoteXml: `<?xml version="1.0" encoding="UTF-8"?>
<xml>
<records>
  <record>
    <ref-type id="17" name="Journal Article">17</ref-type>
    <rec-number>1</rec-number>
    <contributors><authors>
      <author>Smith, John</author>
      <author>Doe, Jane</author>
    </authors></contributors>
    <titles>
      <title>EndNote Sample Article</title>
      <secondary-title>Journal of Examples</secondary-title>
    </titles>
    <dates><year>2024</year></dates>
    <volume>123</volume>
    <pages>45-67</pages>
    <electronic-resource-num>10.1038/example.2024</electronic-resource-num>
  </record>
</records>
</xml>`,

  // GEDCOM 5.5.1 with two individuals + one family
  gedcom: `0 HEAD
1 SOUR test
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Smith/
1 SEX M
1 BIRT
2 DATE 1 JAN 1950
2 PLAC Boston, USA
1 FAMS @F1@
0 @I2@ INDI
1 NAME Jane /Smith/
1 SEX F
1 BIRT
2 DATE 5 MAR 1952
1 FAMS @F1@
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 MARR
2 DATE 12 JUN 1975
0 TRLR
`,

  // ADIF with two QSOs. CRITICAL: every <TAG:N> length declaration MUST
  // exactly match the value byte length, or the byte-counting parser
  // walks off the end of one tag into the next and corrupts everything.
  adif: `Generated for tests
<ADIF_VER:5>3.1.4
<PROGRAMID:12>test-fixture
<EOH>
<CALL:5>K1ABC<QSO_DATE:8>20240101<TIME_ON:4>1200<BAND:3>20m<MODE:3>SSB<RST_SENT:2>59<RST_RCVD:2>59<EOR>
<CALL:5>W2DEF<QSO_DATE:8>20240102<TIME_ON:4>1500<BAND:3>40m<MODE:2>CW<RST_SENT:3>599<RST_RCVD:3>599<EOR>
`,

  // Cabrillo log
  cabrillo: `START-OF-LOG: 3.0
CALLSIGN: TEST
CONTEST: SAMPLE
QSO:  14000 PH 2024-01-01 1200 TEST          59  001    K1ABC         59  001
QSO:   7000 CW 2024-01-02 1500 TEST          599 002    W2DEF         599 002
END-OF-LOG:
`,

  // QIF (Quicken Interchange Format)
  qif: `!Type:Bank
D03/15/2024
T-50.00
PCoffee Shop
^
D03/16/2024
T2500.00
PEmployer Payroll
^
`,

  // OFX 2.x XML
  ofx: `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="200" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
      <STMTRS>
        <CURDEF>USD</CURDEF>
        <BANKACCTFROM>
          <BANKID>000000000</BANKID>
          <ACCTID>1234567890</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20240301000000</DTSTART>
          <DTEND>20240331000000</DTEND>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20240315000000</DTPOSTED>
            <TRNAMT>-50.00</TRNAMT>
            <FITID>20240315001</FITID>
            <NAME>Coffee Shop</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`,

  // Kindle My Clippings.txt
  kindleClippings: `Sample Book Title (Some Author)
- Your Highlight on Location 100-105 | Added on Wednesday, January 1, 2025 12:00:00 PM

This is a highlighted passage from the book.
==========
Another Book (Different Author)
- Your Note on Page 42 | Added on Thursday, January 2, 2025 1:30:00 PM

This is a personal note attached to the book.
==========
`,

  // WhatsApp chat (iOS-style timestamps)
  whatsappChat: `[01/01/2024, 12:00:00] Alice: Hey, how are you?
[01/01/2024, 12:01:00] Bob: Doing well, thanks!
[01/01/2024, 12:02:00] Alice: Great to hear.
`,

  // Discord chat exporter JSON
  discordChat: `{
  "guild": {"id":"123","name":"Test Server"},
  "channel": {"id":"456","name":"general"},
  "messages": [
    {
      "id":"1",
      "type":"Default",
      "timestamp":"2024-01-01T12:00:00.000Z",
      "author":{"id":"u1","name":"Alice"},
      "content":"hello world",
      "attachments":[],
      "reactions":[]
    },
    {
      "id":"2",
      "type":"Default",
      "timestamp":"2024-01-01T12:05:00.000Z",
      "author":{"id":"u2","name":"Bob"},
      "content":"hey there",
      "attachments":[],
      "reactions":[]
    }
  ]
}`,

  // SARIF v2.1.0 with one finding
  sarif: `{
  "version": "2.1.0",
  "runs": [{
    "tool": {
      "driver": {
        "name": "TestLinter",
        "version": "1.0.0",
        "rules": [{"id":"R001","name":"sample","shortDescription":{"text":"Sample rule"}}]
      }
    },
    "results": [{
      "ruleId": "R001",
      "level": "warning",
      "message": {"text":"Test warning message"},
      "locations": [{
        "physicalLocation": {
          "artifactLocation": {"uri":"src/example.ts"},
          "region": {"startLine":10,"startColumn":5}
        }
      }]
    }]
  }]
}`,

  // EDI X12 850 Purchase Order (minimal)
  ediX12: `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240101*1200*U*00401*000000001*0*P*:~GS*PO*SENDER*RECEIVER*20240101*1200*1*X*004010~ST*850*0001~BEG*00*SA*PO12345**20240101~SE*3*0001~GE*1*1~IEA*1*000000001~`,

  // EDIFACT ORDERS message (minimal)
  edifact: `UNB+UNOC:3+SENDER+RECEIVER+240101:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+PO12345+9'DTM+137:20240101:102'UNT+4+1'UNZ+1+1'`,

  // PACER-style docket HTML (minimal but realistic structure)
  pacerDocket: `<html><body>
  <h1>U.S. District Court, Northern District of California</h1>
  <p>Honorable: Jane Doe</p>
  <p>Date Filed: 03/15/2024</p>
  <table>
    <tr><th>Date Filed</th><th>#</th><th>Docket Text</th></tr>
    <tr><td>03/15/2024</td><td>1</td><td>COMPLAINT against Defendant. <a href="/doc1.pdf">Document</a></td></tr>
    <tr><td>03/20/2024</td><td>2</td><td>SUMMONS issued. <a href="/doc2.pdf">Summons</a></td></tr>
  </table>
</body></html>`,

  // Hex color list
  hexList: `#FF0000
#00FF00
#0000FF
#FFFFFF
#000000
`,

  // GPL (GIMP) palette
  gpl: `GIMP Palette
Name: Test
Columns: 0
#
255   0   0	Red
  0 255   0	Green
  0   0 255	Blue
255 255 255	White
  0   0   0	Black
`,

  // CUBE LUT (3D, 2x2x2 minimal)
  cubeLut: `LUT_3D_SIZE 2
0.000000 0.000000 0.000000
1.000000 0.000000 0.000000
0.000000 1.000000 0.000000
1.000000 1.000000 0.000000
0.000000 0.000000 1.000000
1.000000 0.000000 1.000000
0.000000 1.000000 1.000000
1.000000 1.000000 1.000000
`,

  // EML (RFC-822 email)
  eml: `Date: Mon, 1 Jan 2024 12:00:00 +0000
From: Alice <alice@example.com>
To: Bob <bob@example.com>
Subject: Hello
Message-ID: <test1@example.com>
Content-Type: text/plain; charset=utf-8

Hi Bob,

This is a test email body.

Best,
Alice
`,

  // ---- Color converter fixtures (one value per line) ----
  rgbList: `rgb(255, 0, 0)
rgb(0, 255, 0)
rgb(0, 0, 255)
rgb(255, 255, 255)
rgb(0, 0, 0)
`,
  hslList: `hsl(0, 100%, 50%)
hsl(120, 100%, 50%)
hsl(240, 100%, 50%)
hsl(0, 0%, 100%)
hsl(0, 0%, 0%)
`,
  cmykList: `cmyk(0%, 100%, 100%, 0%)
cmyk(100%, 0%, 100%, 0%)
cmyk(100%, 100%, 0%, 0%)
cmyk(0%, 0%, 0%, 0%)
cmyk(0%, 0%, 0%, 100%)
`,

  // ---- Encoding fixtures ----
  // Plain UTF-8 with a non-ASCII char so we exercise the TextEncoder path
  encodingPlain: "Hello, world! Café 🎵\n",
  // Base64 of `Hello, world! Café 🎵\n` (UTF-8 encoded)
  base64Sample: "SGVsbG8sIHdvcmxkISBDYWbDqSDwn461Cg==",
  // URL-encoded form of `Hello, world! Café 🎵`
  urlEncodedSample: "Hello%2C%20world!%20Caf%C3%A9%20%F0%9F%8E%B5%0A",
  // Hex of "ABC" → 414243
  hexSample: "48656c6c6f",

  // ---- Geographic fixtures ----
  // Minimal but real KML 2.2: one Placemark each of Point, LineString, Polygon
  kml: `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Eiffel Tower</name>
      <description>Paris landmark</description>
      <Point>
        <coordinates>2.2945,48.8584,330</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Sample track</name>
      <LineString>
        <coordinates>2.2945,48.8584,0 2.3000,48.8600,0 2.3050,48.8620,0</coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Triangle</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>0,0 1,0 0,1 0,0</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
`,
  // GPX 1.1: one waypoint, one track with a 3-point segment
  gpx: `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="48.8584" lon="2.2945">
    <ele>330</ele>
    <name>Eiffel Tower</name>
    <desc>Paris landmark</desc>
  </wpt>
  <trk>
    <name>Sample track</name>
    <trkseg>
      <trkpt lat="48.8584" lon="2.2945"><ele>0</ele></trkpt>
      <trkpt lat="48.8600" lon="2.3000"><ele>0</ele></trkpt>
      <trkpt lat="48.8620" lon="2.3050"><ele>0</ele></trkpt>
    </trkseg>
  </trk>
</gpx>
`,
  // GeoJSON FeatureCollection
  geojson: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [2.2945, 48.8584, 330] },
      "properties": { "name": "Eiffel Tower", "description": "Paris landmark" }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[2.2945, 48.8584, 0], [2.3000, 48.8600, 0], [2.3050, 48.8620, 0]]
      },
      "properties": { "name": "Sample track" }
    }
  ]
}
`,

  // ---- JSON Lines (NDJSON) for streaming pipelines ----
  jsonl: `{"name":"Alice","age":30,"city":"Paris"}
{"name":"Bob","age":25,"city":"London"}
{"name":"Carol","age":35,"city":"Tokyo"}
`,

  // ---- INI (Windows-style config) ----
  ini: `[database]
host = localhost
port = 5432
user = admin

[server]
host = 0.0.0.0
port = 8080
debug = true
`,

  // ---- .env (dotenv / Docker style) ----
  env: `# Application config
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk_test_abc123
NODE_ENV=production
PORT=3000
`,

  // ---- JSON5: JSON with comments + trailing commas + unquoted keys ----
  json5: `{
  // Top-level config object
  name: 'Alice',
  age: 30,
  /* multi-line
     comment */
  roles: [
    'admin',
    'editor', // trailing comma OK
  ],
  config: {
    theme: 'dark',
    notifications: true,
  },
}`,

  // ---- SBV (YouTube subtitle) ----
  sbv: `0:00:01.000,0:00:04.000
First caption text

0:00:05.500,0:00:08.250
Second caption
spanning two lines
`,

  // Minimal MusicXML (one note)
  musicXml: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`,
} as const;

/** Helper: wrap a text fixture as a File (which converters expect). */
export function fileFromText(name: string, text: string, type = "text/plain"): File {
  return new File([text], name, { type });
}
