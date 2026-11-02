package com.proof.watch.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text

/** Neobrutalist palette: flat candy colours, thick ink outlines, hard shadows. */
object Brutal {
    val Ink = Color(0xFF111111)
    val Paper = Color(0xFFFFF6E5)
    val Yellow = Color(0xFFFFD23F)
    val Pink = Color(0xFFFF8FB1)
    val Mint = Color(0xFF7CE0B8)
    val Lilac = Color(0xFFB9A6FF)
    val Sky = Color(0xFF7CC6FE)
    val Clay = Color(0xFFFF7A45)
    val White = Color(0xFFFFFFFF)
    val Muted = Color(0xFFE9E2D6)
    val Border = 2.5.dp
    val Shadow = 3.dp
    val Pill = RoundedCornerShape(50)
    val Card = RoundedCornerShape(16.dp)
}

/** Flat fill + thick ink border + a hard (unblurred) ink shadow offset down-right. */
fun Modifier.brutal(color: Color, shape: Shape = Brutal.Card, shadow: Dp = Brutal.Shadow): Modifier =
    this
        .drawBehind {
            val offset = shadow.toPx()
            if (offset > 0f) {
                val outline = shape.createOutline(size, layoutDirection, this)
                translate(offset, offset) { drawOutline(outline, Brutal.Ink) }
            }
        }
        .background(color, shape)
        .border(Brutal.Border, Brutal.Ink, shape)

/** A chunky pill button that physically "presses in" (shadow collapses) when tapped. */
@Composable
fun BrutalButton(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
    emoji: String? = null,
    small: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val shift by animateDpAsState(if (pressed) Brutal.Shadow else 0.dp, label = "press")
    val haptic = LocalHapticFeedback.current
    Box(
        modifier = modifier
            .padding(end = Brutal.Shadow, bottom = Brutal.Shadow)
            .offset(x = shift, y = shift)
            .brutal(if (enabled) color else Brutal.Muted, Brutal.Pill, shadow = Brutal.Shadow - shift)
            .clickable(interactionSource = interaction, indication = null, enabled = enabled) {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onClick()
            }
            .padding(horizontal = 12.dp, vertical = if (small) 6.dp else 9.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = if (emoji != null) "$emoji  $text" else text,
            color = if (enabled) Brutal.Ink else Brutal.Ink.copy(alpha = 0.45f),
            fontSize = if (small) 11.sp else 13.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.4.sp,
            textAlign = TextAlign.Center,
            maxLines = 2,
        )
    }
}

/** A tilted label, like a sticker slapped on the screen. */
@Composable
fun Sticker(text: String, textColor: Color, fill: Color = Brutal.Ink, tilt: Float = -4f) {
    Box(
        modifier = Modifier
            .rotate(tilt)
            .brutal(fill, Brutal.Pill, shadow = 0.dp)
            .padding(horizontal = 10.dp, vertical = 3.dp),
    ) {
        Text(text, color = textColor, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.6.sp)
    }
}

/** Small status chip without a shadow. */
@Composable
fun Chip(text: String, fill: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .brutal(fill, Brutal.Pill, shadow = 0.dp)
            .padding(horizontal = 9.dp, vertical = 3.dp),
    ) {
        Text(text, color = Brutal.Ink, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 0.8.sp)
    }
}

/** Section label used inside the long setup page. */
@Composable
fun Label(text: String) {
    Text(text, color = Brutal.Ink, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.4.sp)
}

/** Pager dots: the current page is a wide ink pill. */
@Composable
fun PageDots(count: Int, current: Int, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        repeat(count) { index ->
            if (index == current) {
                Box(Modifier.size(width = 14.dp, height = 6.dp).background(Brutal.Ink, Brutal.Pill))
            } else {
                Box(Modifier.size(6.dp).border(1.5.dp, Brutal.Ink, CircleShape))
            }
        }
    }
}
