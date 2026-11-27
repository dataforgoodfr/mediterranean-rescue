=== Rescue Atlas Admin ===
Tags: map, humanitarian, back office, rest api
Requires at least: 7.0
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Back office for the Rescue Atlas map of SOS MEDITERRANEE, written by Data for Good volunteers.

== Description ==

Rescue Atlas Admin adds to WordPress what the Rescue Atlas map needs:

* records for map operations, events, ports, ships and glossary terms;
* checks before publication: an inconsistent record is saved, never published;
* three roles: data entry, validation, read only;
* an Operations screen with a map;
* a read-only REST API for the map: `/wp-json/rescue-atlas/v1/`.

Only published and archived records are exposed. Records are archived, never deleted, so the map
can remove them. No personal data is stored: totals only.

Source code, tests and contributor guide: https://github.com/dataforgoodfr/mediterranean-rescue (folder `pocs/wordpress-admin`).

== External services ==

The Operations screen shows a base map from OpenFreeMap (https://openfreemap.org/), loaded by the
browser of the logged-in user: tiles, fonts and icons for the visible area. No data about the user
or the records is sent. OpenFreeMap has no account and no terms beyond its attribution, shown on the
map: OpenFreeMap, OpenMapTiles, OpenStreetMap contributors.

== Installation ==

1. In WordPress, go to Plugins > Add New > Upload Plugin and choose `rescue-atlas-admin.zip`.
2. Activate the plugin. The menu "Rescue Atlas" appears, with the roles.
3. Give each person a role: "Rescue Atlas: data entry" or "Rescue Atlas: validation".
4. Optional: set an API read key in Rescue Atlas > Settings.

Try it on a test site first.

== Changelog ==

= 0.1.0 =
* First version (proof of concept): records, checks, roles, Operations screen, read API.
