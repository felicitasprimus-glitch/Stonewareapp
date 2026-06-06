// PDF-Shoppingliste aus Outfits erzeugen (jsPDF).
import { jsPDF } from 'jspdf'

const GOLD = [176, 141, 87]
const INK = [42, 37, 33]
const SOFT = [120, 110, 98]

export function exportOutfitsPdf(outfits, title = 'Old Money — Shoppingliste') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const margin = 48
  let y = margin

  const ensure = (need) => {
    if (y + need > ph - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Kopf
  doc.setFont('times', 'normal')
  doc.setFontSize(26)
  doc.setTextColor(...INK)
  doc.text(title, margin, y)
  y += 16
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.2)
  doc.line(margin, y, pw - margin, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SOFT)
  doc.text(new Date().toLocaleDateString('de-DE'), margin, y)
  y += 24

  let grand = 0

  outfits.forEach((o) => {
    ensure(90)
    doc.setFont('times', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...INK)
    doc.text(`${o.label}`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GOLD)
    doc.text(`Match ${o.match}%`, pw - margin, y, { align: 'right' })
    y += 16

    doc.setFontSize(9)
    doc.setTextColor(...SOFT)
    const tip = doc.splitTextToSize('Styling: ' + o.tip, pw - margin * 2)
    ensure(tip.length * 12 + 8)
    doc.text(tip, margin, y)
    y += tip.length * 12 + 6

    o.items.forEach((it) => {
      ensure(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...INK)
      doc.text(`• ${it.slot_label}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      const price = it.price ? `${it.price} ${it.currency || '€'}` : '—'
      const name = doc.splitTextToSize(it.name, pw - margin * 2 - 170)
      doc.text(name[0] + (name.length > 1 ? '…' : ''), margin + 78, y)
      doc.setTextColor(...GOLD)
      doc.text(price, pw - margin, y, { align: 'right' })
      y += 13
      if (it.link) {
        doc.setFontSize(7.5)
        doc.setTextColor(90, 120, 160)
        const link = doc.splitTextToSize(it.link, pw - margin * 2 - 80)[0]
        doc.textWithLink(link, margin + 78, y, { url: it.link })
        y += 12
      }
    })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    ensure(20)
    doc.text(
      `Gesamtpreis: ${o.total_price} ${o.currency || '€'}`,
      pw - margin,
      y + 4,
      { align: 'right' }
    )
    grand += o.total_price || 0
    y += 22
    doc.setDrawColor(220, 212, 198)
    doc.setLineWidth(0.6)
    doc.line(margin, y, pw - margin, y)
    y += 18
  })

  ensure(30)
  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text(
    `Summe aller Outfits: ${grand.toFixed(2)} €`,
    pw - margin,
    y,
    { align: 'right' }
  )

  doc.save('old-money-shoppingliste.pdf')
}
