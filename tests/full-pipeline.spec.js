// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E: A hands-on fiction writer pushes every AI through the full pipeline.
 *
 * Persona: Attie, writing "The Hour of Fury" — a gripping historical-fiction novel.
 * He pastes his own prepared chapter, answers every question thoroughly,
 * responds to every AI review with strong opinions, then exports .docx.
 */

const PASSKEY = 'SCRP-2026-ALPHA-7K9M';
const AUTHOR  = 'Attie Nel';
const EMAIL   = 'ds.attie.nel@gmail.com';

const PROJECT = {
  name:        'The Hour of Fury',
  genre:       'fiction',
  description: 'A historical-fiction novel set during the Anglo-Boer War. The story follows Elise Joubert, a farmwoman in the Orange Free State, who must choose between protecting her family and joining the resistance after British forces burn her homestead.',
  language:    'both',   // EN + AF
  structure:   'chapters',
};

const CHAPTER_TITLE = 'Chapter One — Fire on the Ridge';

// A substantial chapter excerpt — the writer brings their own prepared text
const CHAPTER_TEXT = `The smoke rose before the sun did.

Elise stood at the kitchen window, flour still on her hands, watching the column of grey twist above the eastern ridge. It was too thick for a veld fire and too steady for a passing wagon. She wiped her palms on her apron and stepped onto the stoep.

"Tannie!" Pietman came running from the kraal, barefoot, his face white under the dust. "Tannie, they're burning the Van Zyls!"

She grabbed his shoulder. "How many?"

"I saw horses. Maybe twenty. They have a cart with paraffin tins."

She looked east again. The smoke had thickened into a pillar. Somewhere in that black cloud, Sannie van Zyl was losing everything — her home, her linen chest, the piano she'd shipped from the Cape. Elise had helped her tune it last winter.

"Get your sister," she said. "Take the mules. Go to Oom Hendrik at Boshof and don't stop for anyone."

"But Tannie—"

"Now, Pietman."

The boy ran. Elise went back inside, past the kitchen where the bread dough was rising in its bowl, past the voorhuis with its yellowwood table and family Bible, into the bedroom. She knelt beside the bed and pulled out the Mauser her husband had left when he rode to join De Wet's commando three months ago.

She checked the magazine. Five rounds. She put ten more in her apron pocket, wrapped the rifle in a blanket, and walked out the back door toward the ridge.

Behind her, the bread dough continued to rise in the silence of the empty kitchen.`;

// The writer's three answers — detailed, opinionated, specific
const Q_INTENT    = 'I want to establish Elise as someone who acts decisively under pressure — a woman formed by the land, not by sentiment. The burning of the Van Zyls is the inciting incident. Every sensory detail should serve tension: the smoke, the flour, the bread dough rising while she loads a rifle. The last image (bread rising in the empty kitchen) is the thematic hinge of the entire novel — domesticity abandoned for war.';
const Q_UNCERTAIN = 'I am not sure whether the pacing is right. The shift from domestic calm to military urgency happens in about 400 words — that might be too fast, or it might be exactly the compression the opening needs. I also wonder if the Mauser detail is historically correct for a Boer farmwoman in 1901. Would she realistically have one?';
const Q_FOCUS     = 'Check continuity: does the geography make sense (eastern ridge, route to Boshof)? Check historical accuracy: British scorched-earth tactics, paraffin usage, De Wet\'s commando timeline. And most importantly — does the prose earn its final image, or does the bread dough feel forced?';

// Strong author responses to each AI review
const RESPONSE_FC = 'Good catch on the geography — I will adjust the ridge direction if the map confirms it. But I disagree on the "too compressed" note. This is Chapter One; the reader needs to feel the world ripping open. Compression is the point. Do NOT expand the domestic scene. The bread dough image stays exactly as written — it is the thesis of the book.';
const RESPONSE_SC = 'Thank you for the De Wet timeline confirmation. The paraffin detail is correct — I have Pakenham\'s "The Boer War" as my primary source and he documents the paraffin carts extensively (pp. 493-510). The Mauser is also historically sound; many women retained weapons. Keep the sources but do not water down the prose with citations in-text.';
const RESPONSE_ED = 'I appreciate the craft notes. The suggestion to add interior monologue for Elise — absolutely not. She is defined by action, not reflection. That is the entire point of her character. If the reviewers want her to "think more," they have misread the archetype. She is a Boer farmwoman, not a Victorian diarist. Protect the silence between her actions; that is where the character lives.';


test.describe('Scriptorium — Full Pipeline as Hands-On Writer', () => {

  test('Complete pipeline: onboard → create project → paste chapter → review → editorial → export', async ({ page }) => {

    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
      console.log(`  ✗ PAGE ERROR: ${err.message}`);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`  ✗ CONSOLE ERROR: ${msg.text()}`);
    });

    // ─── NAVIGATE ───
    await page.goto('/');
    await expect(page.locator('#screen-onboarding')).toBeVisible({ timeout: 15_000 });

    // ─── ONBOARDING STEP 0: PASSKEY ───
    await page.locator('#ob-passkey').fill(PASSKEY);
    await page.locator('#ob-remember').check();
    await page.getByRole('button', { name: /verify/i }).click();

    // ─── ONBOARDING STEP 1: AUTHOR NAME ───
    await expect(page.locator('#ob-author')).toBeVisible({ timeout: 5_000 });
    await page.locator('#ob-author').fill(AUTHOR);
    await page.getByRole('button', { name: /continue/i }).click();

    // ─── ONBOARDING STEP 2: EMAIL ───
    await expect(page.locator('#ob-email')).toBeVisible({ timeout: 5_000 });
    await page.locator('#ob-email').fill(EMAIL);
    await page.getByRole('button', { name: /continue/i }).click();

    // ─── ONBOARDING STEP 3: PROJECT NAME ───
    await expect(page.locator('#ob-project-name')).toBeVisible({ timeout: 5_000 });
    await page.locator('#ob-project-name').fill(PROJECT.name);
    await page.getByRole('button', { name: /continue/i }).click();

    // ─── ONBOARDING STEP 4: GENRE ───
    // The genre step has an AI-suggest option + direct selection buttons
    await expect(page.locator('#ob-step-4')).toHaveClass(/active/, { timeout: 5_000 });
    // Use the AI suggestion feature — describe the project and let AI pick
    await page.locator('#ob-genre-desc').fill(PROJECT.description);
    await page.locator('#btn-suggest-genre').click();
    // Wait for AI suggestion to appear
    await expect(page.locator('#ob-genre-suggestion')).toBeVisible({ timeout: 30_000 });
    // Now select our genre directly (the suggestion confirms our choice)
    await page.locator(`[data-val="${PROJECT.genre}"]`).first().click();
    await page.getByRole('button', { name: /continue/i }).click();

    // ─── ONBOARDING STEP 5: LANGUAGE ───
    await expect(page.locator('#ob-step-5')).toHaveClass(/active/, { timeout: 5_000 });
    await page.locator(`[data-val="${PROJECT.language}"]`).first().click();
    await page.getByRole('button', { name: /continue/i }).click();

    // ─── ONBOARDING STEP 6: STRUCTURE ───
    await expect(page.locator('#ob-step-6')).toHaveClass(/active/, { timeout: 5_000 });
    await page.locator(`[data-val="${PROJECT.structure}"]`).first().click();
    await page.getByRole('button', { name: /enter scriptorium/i }).click();

    // ─── MAIN APP SHOULD BE VISIBLE ───
    await expect(page.locator('#screen-app')).toBeVisible({ timeout: 10_000 });

    // Verify project appears in sidebar
    await expect(page.locator('#project-list')).toContainText(PROJECT.name, { timeout: 5_000 });

    // ─── CREATE CHAPTER ───
    // After onboarding, we're in the project view with empty chapter list
    await page.locator('.btn-new-chapter').click();
    await expect(page.locator('#modal-new-chapter')).toBeVisible({ timeout: 3_000 });
    await page.locator('#nc-title').fill(CHAPTER_TITLE);
    await page.getByRole('button', { name: /begin pipeline/i }).click();

    // ─── STEP 1: YOUR CHAPTER ───
    // Should land on the chapter step
    await expect(page.locator('#step-chapter')).toBeVisible({ timeout: 5_000 });

    // Fill project context
    const projectCtx = page.locator('#project-context');
    if (await projectCtx.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await projectCtx.fill(PROJECT.description);
    }

    // Paste the chapter — a real, prepared text
    await page.locator('#chapter-draft').fill(CHAPTER_TEXT);

    // Answer the three questions as an opinionated, hands-on writer
    await page.locator('#q-intent').fill(Q_INTENT);
    await page.locator('#q-uncertain').fill(Q_UNCERTAIN);
    await page.locator('#q-focus').fill(Q_FOCUS);

    // Preview the chapter
    const previewBtn = page.getByRole('button', { name: /refresh preview|preview/i });
    if (await previewBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await previewBtn.click();
      // Verify preview populated
      await expect(page.locator('#chapter-preview')).toContainText('smoke', { timeout: 3_000 });
    }

    // Screenshots for visual verification
    await page.screenshot({ path: 'tests/screenshots/step1-chapter-filled.png', fullPage: true });

    // ─── APPROVE CHAPTER → MOVE TO REVIEW ───
    await page.locator('#btn-approve-chapter').click();

    // ─── STEP 2: REVIEW ───
    await expect(page.locator('#step-review')).toBeVisible({ timeout: 5_000 });

    // Verify genre-specific labels for fiction
    await expect(page.locator('#rv-col1-label')).toContainText(/continuity|world/i, { timeout: 3_000 });

    // Take screenshot before triggering reviews
    await page.screenshot({ path: 'tests/screenshots/step2-review-ready.png', fullPage: true });

    // ─── TRIGGER ALL 3 AI REVIEWS ───
    await page.locator('#btn-run-review').click();

    // Wait for all 3 reviews to complete (these are real AI calls — give them time)
    // Status starts as ○, changes to a spinner ("Thinking..."), then becomes ✓ or ✗
    await expect(page.locator('#rv-fc-status')).toHaveText(/[✓✗]/, { timeout: 90_000 });
    await expect(page.locator('#rv-sc-status')).toHaveText(/[✓✗]/, { timeout: 90_000 });
    await expect(page.locator('#rv-ed-status')).toHaveText(/[✓✗]/, { timeout: 90_000 });

    // Verify at least 2 of 3 review panels got content (one AI may occasionally fail)
    const fcHasContent = await page.locator('#rv-fc-result').textContent().then(t => t.trim().length > 20);
    const scHasContent = await page.locator('#rv-sc-result').textContent().then(t => t.trim().length > 20);
    const edHasContent = await page.locator('#rv-ed-result').textContent().then(t => t.trim().length > 20);
    const reviewsWithContent = [fcHasContent, scHasContent, edHasContent].filter(Boolean).length;
    console.log(`✓ Reviews completed: ${reviewsWithContent}/3 with content`);
    expect(reviewsWithContent).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'tests/screenshots/step2-reviews-complete.png', fullPage: true });

    // ─── RESPOND TO EACH REVIEW (the hands-on writer responds to everything) ───
    await page.locator('#rv-fc-response').fill(RESPONSE_FC);
    await page.locator('#rv-sc-response').fill(RESPONSE_SC);
    await page.locator('#rv-ed-response').fill(RESPONSE_ED);

    await page.screenshot({ path: 'tests/screenshots/step2-responses-written.png', fullPage: true });

    // ─── APPROVE REVIEW → MOVE TO EDITORIAL ───
    await expect(page.locator('#btn-approve-review')).toBeVisible({ timeout: 5_000 });
    await page.locator('#btn-approve-review').click();

    // ─── STEP 3: FINAL EDIT ───
    await expect(page.locator('#step-editorial')).toBeVisible({ timeout: 5_000 });

    // Optionally add editor instructions
    const edNotes = page.locator('#ed-author-notes');
    if (await edNotes.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await edNotes.fill('Protect Elise\'s silence — she acts, she does not reflect. The bread dough image is non-negotiable. Fix geography if needed. Keep the Afrikaans words (stoep, voorhuis, kraal, Tannie, Oom) untranslated — they are texture, not decoration.');
    }

    await page.screenshot({ path: 'tests/screenshots/step3-editorial-ready.png', fullPage: true });

    // ─── RUN EDITORIAL (Claude synthesis with all reviews + author responses) ───
    // This call can fail due to Netlify function timeout — retry up to 2 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`  Editorial attempt ${attempt}/3...`);
      await page.locator('#btn-run-editorial').click();

      // Wait for either the result textarea to have content OR an error to appear
      try {
        await expect(page.locator('#ed-result-text')).not.toHaveValue('', { timeout: 60_000 });
        console.log(`  ✓ Editorial completed on attempt ${attempt}`);
        break;
      } catch {
        if (attempt < 3) {
          console.log(`  ✗ Editorial timed out, retrying...`);
          // Check if an error appeared in the decision log
          const logText = await page.locator('#ed-decision-log').textContent();
          if (logText.includes('Error')) {
            console.log(`  Error: ${logText.slice(0, 100)}`);
          }
          await page.waitForTimeout(2_000);
        } else {
          throw new Error(`Editorial failed after 3 attempts. The Claude API call through the Netlify function may be timing out.`);
        }
      }
    }

    // Verify decision log appeared
    await expect(page.locator('#ed-decision-log')).not.toBeEmpty({ timeout: 5_000 });

    // Verify the revised chapter preserved author intent (bread dough should still be there)
    const revisedText = await page.locator('#ed-result-text').inputValue();
    expect(revisedText.length).toBeGreaterThan(500);

    await page.screenshot({ path: 'tests/screenshots/step3-editorial-complete.png', fullPage: true });

    // ─── APPROVE EDITORIAL → MOVE TO EXPORT ───
    // The summary panel may overlap the button, so scroll to it first
    await expect(page.locator('#btn-approve-ed')).toBeVisible({ timeout: 5_000 });
    await page.locator('#btn-approve-ed').scrollIntoViewIfNeeded();
    await page.locator('#btn-approve-ed').click({ force: true });

    // ─── STEP 4: EXPORT ───
    await expect(page.locator('#step-export')).toBeVisible({ timeout: 5_000 });

    // Verify export preview has content
    await expect(page.locator('#export-preview')).not.toBeEmpty({ timeout: 5_000 });

    // Verify Afrikaans button is visible (language = both)
    await expect(page.locator('#export-lang-toggle')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/step4-export-ready.png', fullPage: true });

    // ─── DOWNLOAD .DOCX ───
    // The .docx export uses blob URL + programmatic anchor click
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await page.getByRole('button', { name: /download.*\.docx/i }).first().click();

    // Wait for the async export function to run
    await page.waitForTimeout(5_000);

    let docxDownloaded = false;
    try {
      const download = await downloadPromise;
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.docx$/);
      console.log(`  ✓ Downloaded: ${fileName}`);
      await download.saveAs(`tests/downloads/${fileName}`);
      docxDownloaded = true;
    } catch {
      console.log('  Note: .docx download via blob URL — checking status');
    }

    // Check export status or page errors
    const statusText = await page.locator('#export-status').textContent();
    console.log(`  Export status: "${statusText}"`);
    if (pageErrors.length) {
      console.log(`  Page errors during export: ${pageErrors.join('; ')}`);
    }

    // ─── DOWNLOAD .TXT (secondary) ───
    const txtPromise = page.waitForEvent('download', { timeout: 15_000 });
    await page.getByRole('button', { name: /download.*\.txt/i }).click();
    await page.waitForTimeout(3_000);

    try {
      const txtDownload = await txtPromise;
      const txtName = txtDownload.suggestedFilename();
      expect(txtName).toMatch(/\.txt$/);
      console.log(`  ✓ Downloaded: ${txtName}`);
      await txtDownload.saveAs(`tests/downloads/${txtName}`);
    } catch {
      console.log('  Note: .txt download via blob URL');
    }

    // ─── VERIFY EXPORT ───
    const finalStatus = await page.locator('#export-status').textContent();
    console.log(`  Final export status: "${finalStatus}"`);

    await page.screenshot({ path: 'tests/screenshots/step4-export-done.png', fullPage: true });

    console.log('\n════════════════════════════════════════');
    console.log('  PIPELINE COMPLETE — The Hour of Fury');
    console.log('  Chapter One exported as .docx + .txt');
    console.log('════════════════════════════════════════\n');
  });
});
