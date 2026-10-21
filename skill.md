# Discord UI Engineering Skill

Version: Latest

Scope:
- Discord REST API
- Components V2
- Embeds
- Buttons
- Select Menus
- Modals
- Slash Commands
- Context Menus
- Message Components
- Interaction Responses
- Webhooks
- Application Commands

Primary Source

https://docs.discord.com/developers/components/reference

https://docs.discord.com/developers/docs

These documents override every previous knowledge.

Never generate code that conflicts with the official documentation.

---

# Framework Detection

Before generating code, inspect the current project.

Automatically detect:

discord.js

discord.py

py-cord

nextcord

disnake

interactions.py

JDA

Discord.Net

Eris

Detritus

Harmony

DSharpPlus

REST API only

If multiple exist, follow the framework already used by the project.

Never rewrite the project into another framework.

---

# API Priority

Always design from the official Discord API first.

Then translate into the current framework.

Never generate framework-specific hacks when the API already supports the feature.

---

# Components V2

Prefer Components V2 whenever supported.

Required flag

32768

(IS_COMPONENTS_V2)

Never omit the flag.

---

# Valid Components

Only use officially documented components.

Container

Section

Text Display

Separator

Thumbnail

Media Gallery

File

Action Row

Button

String Select

User Select

Role Select

Mentionable Select

Channel Select

Label

Text Input

Checkbox

Radio Group

Modal

Never invent components.

Never use undocumented properties.

---

# Containers

Every complex message should use Container.

Containers define the card hierarchy.

Keep hierarchy clean.

Container

↓

Section

↓

Text

↓

Accessory

↓

Buttons

---

# Text

Prefer Text Display over Embed text when Components V2 is enabled.

Support markdown.

Avoid unnecessary formatting.

---

# Images

Single image

→ Thumbnail

Several images

→ Media Gallery

Attachments

→ File Component

Never fake image layouts.

---

# Buttons

Styles

Primary

Secondary

Success

Danger

Link

Premium

Rules

custom_id

required except Link

url

only Link

sku_id

only Premium

Never mix url and custom_id.

---

# Select Menus

Always include

placeholder

min_values

max_values

Use default values when available.

---

# Modals

Allowed

Label

↓

Text Input

Checkbox

Radio Group

Select Menu

Never place Action Row inside Modal.

---

# IDs

Interactive components require predictable IDs.

Good

ticket_close

payment_confirm

shop_buy

admin_delete

Never generate random IDs.

---

# Limits

Always respect official Discord limits.

Never exceed component count.

Never exceed text length.

Never exceed option count.

Never exceed embed limits when embeds are used.

---

# Slash Commands

Generate

name

description

options

choices

autocomplete

permissions

localizations

according to official API.

---

# Embeds

If Components V2 are requested

↓

Avoid EmbedBuilder unless required.

If embeds are requested explicitly

↓

Follow official embed limits.

---

# Accessibility

Buttons should have meaningful labels.

Images should include descriptions whenever supported.

Avoid emoji-only buttons.

---

# UX

Group related information.

Use separators.

Avoid giant walls of text.

Primary action

Secondary action

Danger action

should be visually distinct.

---

# Error Handling

Always validate

custom_id

permissions

interaction state

missing options

timeouts

unknown component

expired interaction

Always defer interactions if processing exceeds Discord timing requirements.

---

# Localization

Support localization whenever the framework allows it.

Never hardcode English if the project already uses i18n.

---

# Coding Style

Follow the existing project style.

Reuse existing utilities.

Reuse builders.

Reuse constants.

Reuse enums.

Do not duplicate code.

---

# Code Quality

Production ready.

No placeholders.

No TODO.

No pseudo code.

No fake APIs.

No deprecated APIs.

No unused imports.

No dead code.

No duplicated logic.

---

# Output Rules

Return complete production-ready code.

Never explain unless asked.

Never generate partial snippets.

Never invent Discord features.

If documentation and memory conflict

↓

Official documentation wins.
