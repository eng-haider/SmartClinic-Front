import AppKit
import AVFoundation
import CoreVideo

// SmartClinic booth promo — 15 seconds, 1920×1080, silent.
// The visual language follows the real SmartClinic dashboard while every
// patient name, balance and appointment shown here is illustrative.

let width = 1920
let height = 1080
let fps = 30
let totalFrames = fps * 15
let outputURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("marketing/SmartClinic-booth-promo-15s.mp4")

try? FileManager.default.removeItem(at: outputURL)

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
    NSColor(
        red: CGFloat((hex >> 16) & 0xFF) / 255,
        green: CGFloat((hex >> 8) & 0xFF) / 255,
        blue: CGFloat(hex & 0xFF) / 255,
        alpha: alpha
    )
}

let navy = color(0x102D45)
let brand = color(0x17638D)
let sky = color(0x3DB8D4)
let mint = color(0x51B36B)
let amber = color(0xF2A63B)
let coral = color(0xEC6467)
let ink = color(0x183044)
let muted = color(0x6C7B87)
let white = NSColor.white

func clamp(_ value: CGFloat) -> CGFloat { min(1, max(0, value)) }
func easeOut(_ value: CGFloat) -> CGFloat { 1 - pow(1 - clamp(value), 3) }
func easeInOut(_ value: CGFloat) -> CGFloat { value < 0.5 ? 4 * value * value * value : 1 - pow(-2 * value + 2, 3) / 2 }
func mix(_ a: CGFloat, _ b: CGFloat, _ amount: CGFloat) -> CGFloat { a + (b - a) * amount }

func rounded(_ ctx: CGContext, _ rect: CGRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, line: CGFloat = 1) {
    let path = CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
    ctx.setFillColor(fill.cgColor)
    ctx.addPath(path)
    ctx.fillPath()
    if let stroke {
        ctx.setStrokeColor(stroke.cgColor)
        ctx.setLineWidth(line)
        ctx.addPath(path)
        ctx.strokePath()
    }
}

func circle(_ ctx: CGContext, _ x: CGFloat, _ y: CGFloat, _ r: CGFloat, _ fill: NSColor) {
    ctx.setFillColor(fill.cgColor)
    ctx.fillEllipse(in: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2))
}

func line(_ ctx: CGContext, from: CGPoint, to: CGPoint, _ color: NSColor, _ width: CGFloat = 1) {
    ctx.setStrokeColor(color.cgColor)
    ctx.setLineWidth(width)
    ctx.move(to: from)
    ctx.addLine(to: to)
    ctx.strokePath()
}

func text(_ value: String, _ rect: CGRect, size: CGFloat, weight: NSFont.Weight = .regular, color: NSColor = ink, align: NSTextAlignment = .right, alpha: CGFloat = 1) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = align
    paragraph.baseWritingDirection = align == .right ? .rightToLeft : .leftToRight
    paragraph.lineBreakMode = .byTruncatingTail
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: color.withAlphaComponent(alpha),
        .paragraphStyle: paragraph,
        .kern: 0.1
    ]
    NSAttributedString(string: value, attributes: attributes).draw(in: rect)
}

func gradient(_ ctx: CGContext, _ rect: CGRect, _ first: NSColor, _ second: NSColor) {
    guard let cgGradient = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [first.cgColor, second.cgColor] as CFArray,
        locations: [0, 1]
    ) else { return }
    ctx.saveGState()
    ctx.addRect(rect)
    ctx.clip()
    ctx.drawLinearGradient(cgGradient, start: CGPoint(x: rect.minX, y: rect.minY), end: CGPoint(x: rect.maxX, y: rect.maxY), options: [])
    ctx.restoreGState()
}

func background(_ ctx: CGContext, time: CGFloat) {
    gradient(ctx, CGRect(x: 0, y: 0, width: width, height: height), navy, brand)
    let drift = sin(time * 0.7) * 55
    circle(ctx, 300 + drift, 900, 360, sky.withAlphaComponent(0.13))
    circle(ctx, 1610 - drift, 155, 285, color(0x9CCB71, 0.10))
    circle(ctx, 1220 + drift * 0.25, 530, 220, color(0x7E75D8, 0.08))
    for index in 0..<18 {
        let x = CGFloat((index * 347) % width)
        let y = CGFloat((index * 191) % height)
        circle(ctx, x, y, 2 + CGFloat(index % 3), white.withAlphaComponent(0.10))
    }
}

func drawBrand(_ ctx: CGContext, alpha: CGFloat = 1) {
    let logo = CGRect(x: 106, y: 932, width: 70, height: 70)
    rounded(ctx, logo, radius: 18, fill: white.withAlphaComponent(0.18), stroke: white.withAlphaComponent(0.35), line: 1)
    rounded(ctx, CGRect(x: 128, y: 949, width: 26, height: 36), radius: 4, fill: white.withAlphaComponent(alpha))
    rounded(ctx, CGRect(x: 123, y: 960, width: 36, height: 14), radius: 4, fill: white.withAlphaComponent(alpha))
    text("Smart", CGRect(x: 190, y: 966, width: 120, height: 28), size: 24, weight: .bold, color: white, align: .left, alpha: alpha)
    text("Clinic", CGRect(x: 190, y: 938, width: 120, height: 28), size: 24, weight: .bold, color: white, align: .left, alpha: alpha)
}

func drawDevice(_ ctx: CGContext, _ rect: CGRect, alpha: CGFloat, scale: CGFloat, content: (CGContext, CGRect, CGFloat) -> Void) {
    ctx.saveGState()
    let cx = rect.midX
    let cy = rect.midY
    ctx.translateBy(x: cx, y: cy)
    ctx.scaleBy(x: scale, y: scale)
    ctx.translateBy(x: -cx, y: -cy)
    ctx.setShadow(offset: CGSize(width: 0, height: -26), blur: 44, color: NSColor.black.withAlphaComponent(0.30 * alpha).cgColor)
    rounded(ctx, rect, radius: 32, fill: white.withAlphaComponent(alpha), stroke: white.withAlphaComponent(0.42 * alpha), line: 2)
    ctx.setShadow(offset: .zero, blur: 0, color: nil)
    let chrome = CGRect(x: rect.minX, y: rect.maxY - 76, width: rect.width, height: 76)
    rounded(ctx, chrome, radius: 32, fill: color(0xF7FAFC, alpha), stroke: nil)
    ctx.setFillColor(brand.withAlphaComponent(alpha).cgColor)
    ctx.fill(CGRect(x: rect.minX, y: chrome.minY, width: rect.width, height: 42))
    circle(ctx, rect.minX + 44, rect.maxY - 38, 7, coral.withAlphaComponent(alpha))
    circle(ctx, rect.minX + 68, rect.maxY - 38, 7, amber.withAlphaComponent(alpha))
    circle(ctx, rect.minX + 92, rect.maxY - 38, 7, mint.withAlphaComponent(alpha))
    text("SmartClinic", CGRect(x: rect.maxX - 250, y: rect.maxY - 54, width: 180, height: 30), size: 20, weight: .semibold, color: white, align: .right, alpha: alpha)
    let body = CGRect(x: rect.minX + 26, y: rect.minY + 24, width: rect.width - 52, height: rect.height - 112)
    content(ctx, body, alpha)
    ctx.restoreGState()
}

func drawSidebar(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat, active: String) {
    let side = CGRect(x: body.maxX - 210, y: body.minY, width: 210, height: body.height)
    rounded(ctx, side, radius: 14, fill: color(0xF7FAFC, alpha))
    let items = ["الرئيسية", "المراجعين", "الحالات", "المواعيد", "الحسابات", "التقارير"]
    for (i, item) in items.enumerated() {
        let y = side.maxY - 94 - CGFloat(i) * 67
        if item == active { rounded(ctx, CGRect(x: side.minX + 16, y: y, width: 178, height: 48), radius: 12, fill: brand.withAlphaComponent(alpha)) }
        text(item, CGRect(x: side.minX + 20, y: y + 12, width: 134, height: 26), size: 17, weight: item == active ? .bold : .medium, color: item == active ? white : muted, align: .right, alpha: alpha)
        circle(ctx, side.maxX - 174, y + 24, 7, (item == active ? white : brand).withAlphaComponent(alpha))
    }
}

func sectionTitle(_ ctx: CGContext, _ body: CGRect, _ title: String, _ subtitle: String, alpha: CGFloat) {
    text(title, CGRect(x: body.maxX - 620, y: body.maxY - 84, width: 380, height: 42), size: 31, weight: .bold, color: ink, align: .right, alpha: alpha)
    text(subtitle, CGRect(x: body.maxX - 640, y: body.maxY - 118, width: 400, height: 28), size: 16, weight: .medium, color: muted, align: .right, alpha: alpha)
}

func statCard(_ ctx: CGContext, _ rect: CGRect, title: String, value: String, icon: NSColor, alpha: CGFloat) {
    rounded(ctx, rect, radius: 18, fill: color(0xFFFFFF, alpha), stroke: color(0xE7EDF1, alpha), line: 1)
    circle(ctx, rect.minX + 42, rect.maxY - 42, 20, icon.withAlphaComponent(0.16 * alpha))
    circle(ctx, rect.minX + 42, rect.maxY - 42, 8, icon.withAlphaComponent(alpha))
    text(value, CGRect(x: rect.minX + 82, y: rect.maxY - 60, width: rect.width - 102, height: 30), size: 27, weight: .bold, color: ink, align: .right, alpha: alpha)
    text(title, CGRect(x: rect.minX + 82, y: rect.maxY - 90, width: rect.width - 102, height: 25), size: 14, weight: .medium, color: muted, align: .right, alpha: alpha)
}

func drawDashboard(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "الرئيسية")
    sectionTitle(ctx, body, "لوحة التحليلات", "كل أعمال العيادة بين يديك", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 32, width: body.width - 276, height: body.height - 175)
    statCard(ctx, CGRect(x: usable.minX, y: usable.maxY - 146, width: 245, height: 128), title: "المراجعين", value: "٢٢", icon: sky, alpha: alpha)
    statCard(ctx, CGRect(x: usable.minX + 270, y: usable.maxY - 146, width: 245, height: 128), title: "الحالات", value: "٧٨", icon: amber, alpha: alpha)
    statCard(ctx, CGRect(x: usable.minX + 540, y: usable.maxY - 146, width: 300, height: 128), title: "الفواتير", value: "٣,٢٣٥,٠٠٠ د.ع", icon: mint, alpha: alpha)
    let chart = CGRect(x: usable.minX, y: usable.minY, width: 840, height: 250)
    rounded(ctx, chart, radius: 20, fill: color(0xF8FBFC, alpha), stroke: color(0xE7EDF1, alpha), line: 1)
    text("نظرة عامة", CGRect(x: chart.maxX - 250, y: chart.maxY - 48, width: 210, height: 30), size: 20, weight: .bold, color: ink, align: .right, alpha: alpha)
    for index in 0..<5 {
        let y = chart.minY + 44 + CGFloat(index) * 34
        line(ctx, from: CGPoint(x: chart.minX + 32, y: y), to: CGPoint(x: chart.maxX - 32, y: y), color(0xDCE7ED, alpha), 1)
    }
    var points: [CGPoint] = []
    for index in 0..<8 {
        let x = chart.minX + 60 + CGFloat(index) * 105
        let y = chart.minY + 62 + [34, 73, 55, 116, 82, 138, 112, 180][index]
        points.append(CGPoint(x: x, y: y))
    }
    ctx.setStrokeColor(sky.withAlphaComponent(alpha).cgColor)
    ctx.setLineWidth(6)
    ctx.setLineJoin(.round)
    ctx.move(to: points[0])
    for p in points.dropFirst() { ctx.addLine(to: p) }
    ctx.strokePath()
    points.forEach { circle(ctx, $0.x, $0.y, 6, sky.withAlphaComponent(alpha)) }
}

func tooth(_ ctx: CGContext, x: CGFloat, y: CGFloat, selected: Bool, alpha: CGFloat) {
    let fill = selected ? sky.withAlphaComponent(alpha) : color(0xECF4F8, alpha)
    rounded(ctx, CGRect(x: x - 16, y: y - 20, width: 32, height: 40), radius: 12, fill: fill, stroke: selected ? brand.withAlphaComponent(alpha) : color(0xC7DDE8, alpha), line: 2)
    line(ctx, from: CGPoint(x: x, y: y - 11), to: CGPoint(x: x, y: y + 11), selected ? white.withAlphaComponent(alpha) : brand.withAlphaComponent(alpha), 1.5)
}

func drawPatient(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "المراجعين")
    sectionTitle(ctx, body, "ملف مريض متكامل", "كل التفاصيل السريرية في شاشة واحدة", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 30, width: body.width - 276, height: body.height - 160)
    let profile = CGRect(x: usable.maxX - 270, y: usable.minY, width: 250, height: usable.height)
    rounded(ctx, profile, radius: 20, fill: color(0xF8FBFC, alpha), stroke: color(0xE2EBF0, alpha), line: 1)
    circle(ctx, profile.midX, profile.maxY - 90, 42, brand.withAlphaComponent(alpha))
    text("مريض تجريبي", CGRect(x: profile.minX + 25, y: profile.maxY - 162, width: 200, height: 30), size: 22, weight: .bold, color: ink, align: .center, alpha: alpha)
    text("آخر زيارة: اليوم", CGRect(x: profile.minX + 25, y: profile.maxY - 195, width: 200, height: 25), size: 14, weight: .medium, color: muted, align: .center, alpha: alpha)
    let rows = ["الملف الطبي", "الحالات", "المواعيد", "الفواتير"]
    for (i, row) in rows.enumerated() {
        let y = profile.maxY - 260 - CGFloat(i) * 57
        rounded(ctx, CGRect(x: profile.minX + 20, y: y, width: 210, height: 42), radius: 11, fill: i == 0 ? brand.withAlphaComponent(alpha) : white.withAlphaComponent(alpha))
        text(row, CGRect(x: profile.minX + 35, y: y + 11, width: 160, height: 24), size: 15, weight: .semibold, color: i == 0 ? white : muted, align: .right, alpha: alpha)
    }
    let chart = CGRect(x: usable.minX, y: usable.minY, width: usable.width - 302, height: usable.height)
    rounded(ctx, chart, radius: 20, fill: white.withAlphaComponent(alpha), stroke: color(0xE2EBF0, alpha), line: 1)
    text("Dental Chart", CGRect(x: chart.minX + 40, y: chart.maxY - 58, width: 240, height: 30), size: 24, weight: .bold, color: brand, align: .left, alpha: alpha)
    text("مخطط الأسنان التفاعلي", CGRect(x: chart.maxX - 390, y: chart.maxY - 58, width: 340, height: 30), size: 23, weight: .bold, color: ink, align: .right, alpha: alpha)
    let centerX = chart.midX
    let topY = chart.midY + 84
    let bottomY = chart.midY - 50
    for i in 0..<16 {
        let x = centerX - 315 + CGFloat(i) * 42
        tooth(ctx, x: x, y: topY + CGFloat(abs(i - 8)) * 4, selected: [2, 3, 11].contains(i), alpha: alpha)
        tooth(ctx, x: x, y: bottomY - CGFloat(abs(i - 8)) * 4, selected: [5, 6, 12].contains(i), alpha: alpha)
    }
    line(ctx, from: CGPoint(x: chart.minX + 62, y: chart.midY + 18), to: CGPoint(x: chart.maxX - 62, y: chart.midY + 18), color(0xD8E5EC, alpha), 2)
    let legend = CGRect(x: chart.minX + 42, y: chart.minY + 40, width: 330, height: 82)
    rounded(ctx, legend, radius: 14, fill: color(0xEAF7FB, alpha))
    circle(ctx, legend.minX + 32, legend.midY, 9, sky.withAlphaComponent(alpha))
    text("تشخيصات وخطة علاج واضحة", CGRect(x: legend.minX + 56, y: legend.minY + 28, width: 244, height: 28), size: 15, weight: .semibold, color: brand, align: .right, alpha: alpha)
}

func drawAppointments(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "المواعيد")
    sectionTitle(ctx, body, "مواعيد وحجوزات منظمة", "جدول يومك بلمحة واحدة", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 30, width: body.width - 276, height: body.height - 160)
    let calendar = CGRect(x: usable.minX, y: usable.minY, width: usable.width, height: usable.height)
    rounded(ctx, calendar, radius: 20, fill: white.withAlphaComponent(alpha), stroke: color(0xE2EBF0, alpha), line: 1)
    let days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
    let gridX = calendar.minX + 92
    let gridY = calendar.minY + 46
    let gridW = calendar.width - 124
    let dayW = gridW / 5
    for i in 0..<6 { line(ctx, from: CGPoint(x: gridX + CGFloat(i) * dayW, y: gridY), to: CGPoint(x: gridX + CGFloat(i) * dayW, y: calendar.maxY - 55), color(0xE4EDF2, alpha), 1) }
    for i in 0..<6 { line(ctx, from: CGPoint(x: gridX, y: gridY + CGFloat(i) * 66), to: CGPoint(x: gridX + gridW, y: gridY + CGFloat(i) * 66), color(0xE4EDF2, alpha), 1) }
    for (i, day) in days.enumerated() { text(day, CGRect(x: gridX + CGFloat(i) * dayW + 8, y: calendar.maxY - 43, width: dayW - 16, height: 26), size: 16, weight: .bold, color: brand, align: .center, alpha: alpha) }
    let times = ["٩:٠٠", "١٠:٠٠", "١١:٠٠", "١٢:٠٠", "١:٠٠"]
    for (i, time) in times.enumerated() { text(time, CGRect(x: calendar.minX + 18, y: gridY + CGFloat(4 - i) * 66 + 22, width: 58, height: 24), size: 14, weight: .medium, color: muted, align: .center, alpha: alpha) }
    let bookings: [(Int, Int, NSColor, String)] = [(0, 3, mint, "فحص"), (1, 2, sky, "استشارة"), (2, 4, amber, "متابعة"), (3, 1, coral, "علاج"), (4, 3, mint, "مراجعة")]
    for (day, row, c, label) in bookings {
        let r = CGRect(x: gridX + CGFloat(day) * dayW + 12, y: gridY + CGFloat(row) * 66 + 8, width: dayW - 24, height: 50)
        rounded(ctx, r, radius: 11, fill: c.withAlphaComponent(0.18 * alpha), stroke: c.withAlphaComponent(0.55 * alpha), line: 1)
        text(label, CGRect(x: r.minX + 10, y: r.minY + 15, width: r.width - 20, height: 22), size: 14, weight: .bold, color: c, align: .center, alpha: alpha)
    }
}

func drawCases(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "الحالات")
    sectionTitle(ctx, body, "متابعة أدق للحالات", "من التشخيص إلى اكتمال العلاج", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 30, width: body.width - 276, height: body.height - 160)
    let left = CGRect(x: usable.minX, y: usable.minY, width: 500, height: usable.height)
    rounded(ctx, left, radius: 20, fill: white.withAlphaComponent(alpha), stroke: color(0xE2EBF0, alpha), line: 1)
    text("مسار الحالة", CGRect(x: left.maxX - 220, y: left.maxY - 54, width: 180, height: 30), size: 22, weight: .bold, color: ink, align: .right, alpha: alpha)
    let steps = [("تشخيص", sky), ("خطة علاج", amber), ("جلسة علاج", coral), ("متابعة", mint)]
    for (i, step) in steps.enumerated() {
        let y = left.maxY - 132 - CGFloat(i) * 102
        circle(ctx, left.minX + 72, y, 25, step.1.withAlphaComponent(alpha))
        if i < steps.count - 1 { line(ctx, from: CGPoint(x: left.minX + 72, y: y - 26), to: CGPoint(x: left.minX + 72, y: y - 76), color(0xD8E7EE, alpha), 4) }
        text(step.0, CGRect(x: left.minX + 118, y: y - 13, width: 260, height: 28), size: 19, weight: .bold, color: ink, align: .right, alpha: alpha)
        text(i == 3 ? "مكتمل" : "قيد المتابعة", CGRect(x: left.minX + 118, y: y - 40, width: 260, height: 22), size: 13, weight: .medium, color: muted, align: .right, alpha: alpha)
    }
    let overview = CGRect(x: usable.minX + 530, y: usable.minY, width: usable.width - 530, height: usable.height)
    rounded(ctx, overview, radius: 20, fill: color(0xF8FBFC, alpha), stroke: color(0xE2EBF0, alpha), line: 1)
    text("حالات العيادة", CGRect(x: overview.maxX - 270, y: overview.maxY - 54, width: 220, height: 30), size: 22, weight: .bold, color: ink, align: .right, alpha: alpha)
    let data: [(String, CGFloat, NSColor)] = [("قيد العلاج", 0.78, sky), ("بانتظار موعد", 0.58, amber), ("مكتملة", 0.9, mint)]
    for (i, row) in data.enumerated() {
        let y = overview.maxY - 140 - CGFloat(i) * 102
        text(row.0, CGRect(x: overview.minX + 46, y: y + 30, width: 190, height: 26), size: 18, weight: .bold, color: ink, align: .right, alpha: alpha)
        rounded(ctx, CGRect(x: overview.minX + 270, y: y + 25, width: overview.width - 340, height: 30), radius: 15, fill: color(0xE4EEF2, alpha))
        rounded(ctx, CGRect(x: overview.minX + 270, y: y + 25, width: (overview.width - 340) * row.1, height: 30), radius: 15, fill: row.2.withAlphaComponent(alpha))
    }
}

func drawBills(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "الحسابات")
    sectionTitle(ctx, body, "تحكم أوضح بالفواتير", "تابع المدفوع والمتبقي فوراً", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 30, width: body.width - 276, height: body.height - 160)
    let hero = CGRect(x: usable.minX, y: usable.maxY - 190, width: usable.width, height: 170)
    rounded(ctx, hero, radius: 24, fill: color(0xFFF8E6, alpha), stroke: amber.withAlphaComponent(0.45 * alpha), line: 2)
    text("المبالغ المتبقية", CGRect(x: hero.maxX - 550, y: hero.maxY - 73, width: 470, height: 38), size: 30, weight: .bold, color: color(0x7C5414), align: .right, alpha: alpha)
    text("٣,٢٥٠,٠٠٠ د.ع", CGRect(x: hero.maxX - 650, y: hero.maxY - 122, width: 570, height: 52), size: 43, weight: .bold, color: ink, align: .right, alpha: alpha)
    circle(ctx, hero.minX + 92, hero.midY, 48, amber.withAlphaComponent(0.20 * alpha))
    text("د.ع", CGRect(x: hero.minX + 62, y: hero.midY - 16, width: 60, height: 32), size: 19, weight: .bold, color: amber, align: .center, alpha: alpha)
    let invoices = [("فاتورة #١٠٤٨", "المتبقي ٧٥٠,٠٠٠ د.ع", coral), ("فاتورة #١٠٤٩", "المتبقي ١,٢٠٠,٠٠٠ د.ع", amber), ("فاتورة #١٠٥٠", "المتبقي ١,٣٠٠,٠٠٠ د.ع", sky)]
    for (i, inv) in invoices.enumerated() {
        let r = CGRect(x: usable.minX, y: usable.maxY - 250 - CGFloat(i) * 112, width: usable.width, height: 88)
        rounded(ctx, r, radius: 16, fill: white.withAlphaComponent(alpha), stroke: color(0xE2EBF0, alpha), line: 1)
        circle(ctx, r.minX + 48, r.midY, 21, inv.2.withAlphaComponent(0.15 * alpha))
        circle(ctx, r.minX + 48, r.midY, 8, inv.2.withAlphaComponent(alpha))
        text(inv.0, CGRect(x: r.maxX - 360, y: r.maxY - 37, width: 300, height: 28), size: 19, weight: .bold, color: ink, align: .right, alpha: alpha)
        text(inv.1, CGRect(x: r.maxX - 460, y: r.maxY - 65, width: 400, height: 23), size: 15, weight: .semibold, color: inv.2, align: .right, alpha: alpha)
    }
}

func drawAssistant(_ ctx: CGContext, _ body: CGRect, alpha: CGFloat) {
    drawSidebar(ctx, body, alpha: alpha, active: "المراجعين")
    sectionTitle(ctx, body, "المساعد الذكي", "إجابات ومهام من داخل النظام", alpha: alpha)
    let usable = CGRect(x: body.minX + 32, y: body.minY + 30, width: body.width - 276, height: body.height - 160)
    let chat = CGRect(x: usable.midX - 330, y: usable.minY + 12, width: 660, height: usable.height - 24)
    rounded(ctx, chat, radius: 26, fill: color(0xF8FBFC, alpha), stroke: color(0xDCE8EF, alpha), line: 1)
    gradient(ctx, CGRect(x: chat.minX, y: chat.maxY - 82, width: chat.width, height: 82), brand.withAlphaComponent(alpha), sky.withAlphaComponent(alpha))
    text("المساعد الذكي", CGRect(x: chat.maxX - 270, y: chat.maxY - 54, width: 220, height: 30), size: 22, weight: .bold, color: white, align: .right, alpha: alpha)
    let user = CGRect(x: chat.minX + 245, y: chat.maxY - 178, width: 360, height: 62)
    rounded(ctx, user, radius: 18, fill: brand.withAlphaComponent(alpha))
    text("شوفلي أوقات فارغة باچر", CGRect(x: user.minX + 18, y: user.minY + 20, width: user.width - 36, height: 26), size: 16, weight: .medium, color: white, align: .right, alpha: alpha)
    let reply = CGRect(x: chat.minX + 54, y: chat.maxY - 298, width: 455, height: 91)
    rounded(ctx, reply, radius: 18, fill: white.withAlphaComponent(alpha), stroke: color(0xDDE8EF, alpha), line: 1)
    text("هذه الأوقات المتاحة غداً", CGRect(x: reply.minX + 18, y: reply.maxY - 34, width: reply.width - 36, height: 24), size: 16, weight: .bold, color: ink, align: .right, alpha: alpha)
    text("٩:٠٠  •  ١٠:٣٠  •  ٤:٠٠", CGRect(x: reply.minX + 18, y: reply.maxY - 63, width: reply.width - 36, height: 24), size: 15, weight: .semibold, color: mint, align: .right, alpha: alpha)
    rounded(ctx, CGRect(x: chat.minX + 54, y: chat.minY + 35, width: chat.width - 108, height: 53), radius: 16, fill: white.withAlphaComponent(alpha), stroke: color(0xD6E3EB, alpha), line: 1)
    text("اكتب طلبك هنا…", CGRect(x: chat.minX + 84, y: chat.minY + 51, width: chat.width - 160, height: 24), size: 15, weight: .medium, color: muted, align: .right, alpha: alpha)
}

func drawClosing(_ ctx: CGContext, time: CGFloat, alpha: CGFloat) {
    let p = easeOut(time)
    let scale = mix(0.72, 1.0, p)
    ctx.saveGState()
    ctx.translateBy(x: CGFloat(width) / 2, y: CGFloat(height) / 2)
    ctx.scaleBy(x: scale, y: scale)
    ctx.translateBy(x: -CGFloat(width) / 2, y: -CGFloat(height) / 2)
    rounded(ctx, CGRect(x: 800, y: 588, width: 320, height: 190), radius: 48, fill: white.withAlphaComponent(0.16 * alpha), stroke: white.withAlphaComponent(0.40 * alpha), line: 2)
    rounded(ctx, CGRect(x: 900, y: 630, width: 120, height: 104), radius: 14, fill: white.withAlphaComponent(alpha))
    rounded(ctx, CGRect(x: 872, y: 662, width: 176, height: 40), radius: 14, fill: white.withAlphaComponent(alpha))
    text("SmartClinic", CGRect(x: 560, y: 495, width: 800, height: 62), size: 58, weight: .bold, color: white, align: .center, alpha: alpha)
    text("إدارة أذكى لعيادتك", CGRect(x: 560, y: 430, width: 800, height: 45), size: 32, weight: .semibold, color: white.withAlphaComponent(0.88 * alpha), align: .center, alpha: alpha)
    text("كل ما تحتاجه… في نظام واحد", CGRect(x: 560, y: 368, width: 800, height: 36), size: 22, weight: .medium, color: white.withAlphaComponent(0.70 * alpha), align: .center, alpha: alpha)
    ctx.restoreGState()
}

func drawScene(_ ctx: CGContext, index: Int, localTime: CGFloat, alpha: CGFloat) {
    let device = CGRect(x: 208, y: 128, width: 1504, height: 774)
    if index == 5 {
        drawClosing(ctx, time: localTime, alpha: alpha)
        return
    }
    let intro = easeOut(min(1, localTime / 0.55))
    let scale = mix(0.94, 1.0, intro)
    let shifted = CGRect(x: device.minX, y: device.minY - (1 - intro) * 26, width: device.width, height: device.height)
    drawDevice(ctx, shifted, alpha: alpha, scale: scale) { contentCtx, body, contentAlpha in
        switch index {
        case 0: drawDashboard(contentCtx, body, alpha: contentAlpha)
        case 1: drawPatient(contentCtx, body, alpha: contentAlpha)
        case 2: drawAppointments(contentCtx, body, alpha: contentAlpha)
        case 3: drawCases(contentCtx, body, alpha: contentAlpha)
        case 4: drawBills(contentCtx, body, alpha: contentAlpha)
        default: drawAssistant(contentCtx, body, alpha: contentAlpha)
        }
    }
    if index == 0 {
        text("إدارة عيادتك… بذكاء", CGRect(x: 480, y: 56, width: 960, height: 48), size: 34, weight: .bold, color: white, align: .center, alpha: alpha * intro)
    }
}

let durations: [CGFloat] = [2, 3, 3, 3, 2, 2]
let transition: CGFloat = 0.36

func renderFrame(_ context: CGContext, frame: Int) {
    let time = CGFloat(frame) / CGFloat(fps)
    background(context, time: time)
    drawBrand(context)
    var start: CGFloat = 0
    var scene = 0
    for i in 0..<durations.count {
        let end = start + durations[i]
        if time < end || i == durations.count - 1 { scene = i; break }
        start = end
    }
    let local = time - start
    if scene < durations.count - 1 && local > durations[scene] - transition {
        let blend = easeInOut((local - (durations[scene] - transition)) / transition)
        drawScene(context, index: scene, localTime: local, alpha: 1 - blend)
        drawScene(context, index: scene + 1, localTime: 0, alpha: blend)
    } else {
        drawScene(context, index: scene, localTime: local, alpha: 1)
    }
}

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 9_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    ]
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
])
guard writer.canAdd(input) else { fatalError("Cannot add video input") }
writer.add(input)
guard writer.startWriting() else { fatalError("Could not start video writer: \(writer.error?.localizedDescription ?? "unknown error")") }
writer.startSession(atSourceTime: .zero)

let pool = adaptor.pixelBufferPool!
for frame in 0..<totalFrames {
    autoreleasepool {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        var pixelBuffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
        guard let pixelBuffer else { fatalError("Could not create pixel buffer") }
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        let bytes = CVPixelBufferGetBaseAddress(pixelBuffer)!
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let bitmap = CGContext(
            data: bytes,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )!
        bitmap.setFillColor(navy.cgColor)
        bitmap.fill(CGRect(x: 0, y: 0, width: width, height: height))
        let graphics = NSGraphicsContext(cgContext: bitmap, flipped: false)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = graphics
        renderFrame(bitmap, frame: frame)
        NSGraphicsContext.restoreGraphicsState()
        CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        let presentation = CMTime(value: CMTimeValue(frame), timescale: CMTimeScale(fps))
        guard adaptor.append(pixelBuffer, withPresentationTime: presentation) else { fatalError("Could not append frame \(frame)") }
    }
}

input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError("Render failed: \(writer.error?.localizedDescription ?? "unknown error")") }
print("Created \(outputURL.path)")
