package com.proof.watch.tile

import android.content.Context
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.dp
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.proof.watch.MainActivity

/** Neobrutalist tile: yellow face, ink pill, trial day, a bordered verdict chip, today's touches. */
class TrialTileService : TileService() {
    private val ink = 0xFF111111.toInt()
    private val yellow = 0xFFFFD23F.toInt()

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val prefs = getSharedPreferences("proof", Context.MODE_PRIVATE)
        val day = prefs.getString("trialDay", "—") ?: "—"
        val kind = prefs.getString("verdict", "") ?: ""
        val touches = MainActivity.todayCount(prefs)
        val (label, chipColor) = when (kind) {
            "working" -> "WORTH IT" to 0xFF7CE0B8.toInt()
            "no_effect" -> "NOT WORTH IT" to 0xFFFFFFFF.toInt()
            "wrong_way" -> "MAKING IT WORSE" to 0xFFFF8FB1.toInt()
            "too_early" -> "TOO EARLY" to 0xFFFFFFFF.toInt()
            "unidentified" -> "FINISH SETUP" to 0xFFFFFFFF.toInt()
            else -> "OPEN TO REFRESH" to 0xFFFFFFFF.toInt()
        }

        val open = ModifiersBuilders.Clickable.Builder()
            .setId("open")
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setPackageName(packageName)
                            .setClassName(MainActivity::class.java.name)
                            .build(),
                    )
                    .build(),
            )
            .build()

        val column = LayoutElementBuilders.Column.Builder()
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(pill("WORTHIT", fill = ink, textColor = yellow, border = ink, size = 11f))
            .addContent(spacer(6f))
            .addContent(text(if (day == "—") "NO TEST YET" else "DAY $day", 28f))
            .addContent(spacer(6f))
            .addContent(pill(label, fill = chipColor, textColor = ink, border = ink, size = 13f))
            .addContent(spacer(8f))
            .addContent(text("$touches face touches today", 12f))
            .build()

        val root = LayoutElementBuilders.Box.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setBackground(ModifiersBuilders.Background.Builder().setColor(argb(yellow)).build())
                    .setClickable(open)
                    .build(),
            )
            .addContent(column)
            .build()

        val layout = LayoutElementBuilders.Layout.Builder().setRoot(root).build()
        val timeline = TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(TimelineBuilders.TimelineEntry.Builder().setLayout(layout).build())
            .build()
        val tile = TileBuilders.Tile.Builder()
            .setResourcesVersion("2")
            .setFreshnessIntervalMillis(15 * 60 * 1000L)
            .setTileTimeline(timeline)
            .build()
        return Futures.immediateFuture(tile)
    }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> {
        return Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion("2").build())
    }

    private fun text(value: String, size: Float): LayoutElementBuilders.Text =
        LayoutElementBuilders.Text.Builder()
            .setText(value)
            .setMaxLines(2)
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(sp(size))
                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                    .setColor(argb(ink))
                    .build(),
            )
            .build()

    private fun pill(value: String, fill: Int, textColor: Int, border: Int, size: Float): LayoutElementBuilders.Box =
        LayoutElementBuilders.Box.Builder()
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setBackground(
                        ModifiersBuilders.Background.Builder()
                            .setColor(argb(fill))
                            .setCorner(ModifiersBuilders.Corner.Builder().setRadius(dp(99f)).build())
                            .build(),
                    )
                    .setBorder(ModifiersBuilders.Border.Builder().setWidth(dp(2.5f)).setColor(argb(border)).build())
                    .setPadding(
                        ModifiersBuilders.Padding.Builder()
                            .setStart(dp(12f))
                            .setEnd(dp(12f))
                            .setTop(dp(4f))
                            .setBottom(dp(4f))
                            .build(),
                    )
                    .build(),
            )
            .addContent(
                LayoutElementBuilders.Text.Builder()
                    .setText(value)
                    .setFontStyle(
                        LayoutElementBuilders.FontStyle.Builder()
                            .setSize(sp(size))
                            .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                            .setColor(argb(textColor))
                            .build(),
                    )
                    .build(),
            )
            .build()

    private fun spacer(height: Float): LayoutElementBuilders.Spacer =
        LayoutElementBuilders.Spacer.Builder().setHeight(dp(height)).build()
}
