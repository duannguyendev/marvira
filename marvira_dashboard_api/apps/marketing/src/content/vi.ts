import { IMAGES } from '@/lib/site';
import type { MarketingContent } from '@/content/en';

const vi: MarketingContent = {
  brandLine: 'Khám phá thành phố bằng đôi chân.',
  nav: {
    how: 'Cách chơi',
    explore: 'Khám phá',
    create: 'Tạo hunt',
    download: 'Tải app',
    support: 'Hỗ trợ',
    press: 'Báo chí',
  },
  home: {
    headline: 'Biến thành phố thành cuộc săn tìm kho báu.',
    support:
      'Đi bộ tới địa điểm thật, trả lời thử thách, và leo bảng xếp hạng cùng bạn bè.',
    ctaAppStore: 'App Store',
    ctaPlayStore: 'Google Play',
    ctaDownload: 'Tải ứng dụng',
    ctaHow: 'Xem cách chơi',
    heroAlt: 'Mọi người khám phá phố vào giờ vàng',
    heroImageBrief:
      'Ảnh full-bleed bạn bè đi bộ trên phố / quảng trường lúc hoàng hôn — năng lượng outdoor thật, không phải mock UI.',
  },
  how: {
    title: 'Marvira hoạt động thế nào',
    intro: 'Bốn bước đơn giản từ tìm hunt đến đứng đầu bảng.',
    steps: [
      {
        title: 'Tìm một hunt',
        body: 'Duyệt sự kiện gần bạn — đi bộ trung tâm, công viên, và thử thách thành phố đặc biệt.',
      },
      {
        title: 'Đi tới địa điểm',
        body: 'Theo bản đồ tới địa danh thật. GPS check-in khi bạn đến nơi.',
      },
      {
        title: 'Trả lời thử thách',
        body: 'Giải quiz và gợi ý tại mỗi điểm dừng. Không spoil — khám phá mới thú vị.',
      },
      {
        title: 'Leo bảng xếp hạng',
        body: 'Kiếm điểm nhờ tốc độ và độ chính xác. Chia sẻ thành tích với bạn bè.',
      },
    ],
  },
  download: {
    title: 'Tải Marvira',
    intro: 'Cài trên iOS hoặc Android và bắt đầu hunt đầu tiên.',
    qrLabel: 'Quét để cài',
    storesSoon: 'Link cửa hàng sẽ mở khi phát hành công khai. Hãy quay lại sau.',
    deepLinkNote:
      'Đã có app? Mở link hunt được chia sẻ — Marvira sẽ tự khởi chạy.',
  },
  create: {
    title: 'Tạo hunt cho thành phố của bạn',
    intro:
      'Thiết kế scavenger hunt GPS cho sự kiện, đội nhóm, du lịch và trường học — rồi mời người chơi bằng một link.',
    props: [
      {
        title: 'Sự kiện & đội nhóm',
        body: 'Team building, sinh nhật, và thử thách nhóm giúp mọi người cùng vận động.',
      },
      {
        title: 'Du lịch & địa điểm',
        body: 'Biến khu phố, bảo tàng, campus thành lộ trình khám phá có thể chơi.',
      },
      {
        title: 'Trường học & học tập',
        body: 'Quiz ngoài trời khuyến khích tò mò, hợp tác và hiểu biết địa phương.',
      },
    ],
    ctaDownload: 'Tải app để tạo',
  },
  explore: {
    title: 'Khám phá hunt trong thành phố',
    intro: 'Khám phá các cuộc săn tìm do nhà tổ chức Marvira đăng gần bạn.',
    difficulty: 'Độ khó',
    viewInvite: 'Xem lời mời',
    searchPlaceholder: 'Tìm theo tên hoặc địa điểm…',
    empty: 'Chưa có nội dung nào được đăng. Hãy quay lại sau.',
    noResults: 'Không có kết quả nào khớp với tìm kiếm của bạn.',
    loadError: 'Hiện chưa tải được nội dung. Vui lòng thử lại sau ít phút.',
    readMore: 'Đọc thêm',
    backToExplore: 'Quay lại Khám phá',
    playCta: 'Chơi hunt này trong app',
    prevArticle: 'Trước',
    nextArticle: 'Sau',
    pagination: {
      previous: 'Trước',
      next: 'Sau',
      pageOf: 'Trang {current} / {total}',
    },
    items: [
      {
        id: 'seed-event-downtown',
        title: 'Downtown Discovery Hunt',
        blurb:
          'Khám phá khu trung tâm lịch sử và tìm những viên ngọc ẩn qua thử thách tương tác.',
        city: 'San Francisco',
        difficulty: 'Trung bình',
        coverBrief: 'Quảng trường / ferry / skyline — năng lượng phố phường sống động.',
        coverImage: IMAGES.downtown,
      },
      {
        id: 'seed-event-golden-gate',
        title: 'Golden Gate Adventure',
        blurb: 'Hunt scenic dọc khu vực cầu Golden Gate.',
        city: 'San Francisco',
        difficulty: 'Khó',
        coverBrief: 'Điểm nhìn cầu / đường ven biển — năng lượng trail ngoài trời.',
        coverImage: IMAGES.goldenGate,
      },
    ],
  },
  press: {
    title: 'Marvira là gì?',
    onePager:
      'Marvira là app scavenger hunt GPS để khám phá thành phố. Người chơi đi tới địa điểm thật, trả lời thử thách tại chỗ, và cạnh tranh trên bảng xếp hạng. Người tổ chức tạo hunt cho sự kiện, du lịch, địa điểm và trường học — rồi chia sẻ một link mời.',
    audiences: [
      {
        title: 'Thành phố & du lịch',
        body: 'Kích hoạt khu phố bằng lộ trình khám phá đi bộ làm nổi bật địa danh địa phương.',
      },
      {
        title: 'Địa điểm & campus',
        body: 'Mang trải nghiệm tự hướng dẫn mà không cần xây app riêng.',
      },
      {
        title: 'Trường học',
        body: 'Biến lịch sử địa phương và STEM thành thử thách đội ngoài trời.',
      },
      {
        title: 'Người tổ chức',
        body: 'Xuất bản hunt, mời người chơi, và ăn mừng kết quả trên bảng xếp hạng trực tiếp.',
      },
    ],
    boilerplate:
      'Marvira biến thành phố thành scavenger hunt có thể chơi. Đi bộ địa điểm thật, giải thử thách, leo bảng xếp hạng — hoặc tạo hunt cho cộng đồng của bạn.',
    pdfBrief:
      'PDF one-pager tuỳ chọn: ảnh cover đi bộ thành phố, đoạn What is Marvira, bốn bullet đối tượng, CTA store/QR, email liên hệ.',
  },
  support: {
    title: 'Hỗ trợ & FAQ',
    intro: 'Câu hỏi thường gặp cho người chơi và người tổ chức.',
    faqs: [
      {
        q: 'Tôi có cần tài khoản để chơi không?',
        a: 'Có — đăng nhập trong app để tiến độ và điểm bảng xếp hạng gắn với bạn.',
      },
      {
        q: 'Check-in vị trí hoạt động thế nào?',
        a: 'Khi bạn đến gần địa điểm, Marvira dùng GPS để check-in. Hãy ở ngoài trời và bật quyền vị trí.',
      },
      {
        q: 'Tôi có thể tự tạo hunt không?',
        a: 'Có. Creator miễn phí soạn thảo thoải mái và xuất bản số sự kiện giới hạn. Marvira Plus mở unlimited hunt đã xuất bản.',
      },
      {
        q: 'Link sự kiện có mở app không?',
        a: 'Khi app lên store, link dạng /e/{id} sẽ mở Marvira nếu đã cài, hoặc đưa bạn tới trang tải.',
      },
      {
        q: 'Làm sao liên hệ hỗ trợ?',
        a: 'Dùng form phản hồi bên dưới — chúng tôi đọc mọi tin nhắn. Bạn cũng có thể email hello@marvira.example.com.',
      },
    ],
    form: {
      title: 'Gửi tin nhắn cho chúng tôi',
      intro: 'Chia sẻ phản hồi, gợi ý hoặc báo lỗi. Không cần tài khoản.',
      nameLabel: 'Tên của bạn',
      emailLabel: 'Email',
      categoryLabel: 'Danh mục',
      subjectLabel: 'Tiêu đề (tuỳ chọn)',
      messageLabel: 'Nội dung',
      submit: 'Gửi tin nhắn',
      submitting: 'Đang gửi…',
      success: 'Cảm ơn! Tin nhắn của bạn đã được gửi.',
      error: 'Không gửi được tin nhắn. Vui lòng thử lại.',
      categories: {
        feedback: 'Phản hồi',
        suggestion: 'Gợi ý',
        bug: 'Báo lỗi',
        other: 'Khác',
      },
    },
  },
  event: {
    joinCta: 'Tham gia hunt này',
    downloadCta: 'Tải Marvira',
    when: 'Khi nào',
    where: 'Ở đâu',
    how: 'Cách tham gia',
    howBody:
      'Cài Marvira, mở lại link mời này, rồi bắt đầu đi. Đáp án và toạ độ chính xác chỉ có trong app — không spoil ở đây.',
    joinHint: 'Mở trong app nếu đã cài, hoặc tải Marvira trước.',
    leaderboardEmpty: 'Bảng xếp hạng mở khi hunt bắt đầu.',
    leaderboardLive: 'Điểm cập nhật khi người chơi hoàn thành địa điểm.',
    leaderboardEnded: 'Kết quả cuối — cảm ơn đã chơi.',
    notFound: 'Lời mời hunt này không khả dụng.',
  },
  legal: {
    privacyTitle: 'Chính sách quyền riêng tư',
    termsTitle: 'Điều khoản dịch vụ',
    updated: 'Cập nhật lần cuối: 20 tháng 7, 2026',
    counselNote:
      'Bản nháp phục vụ sản phẩm và store. Cần luật sư rà soát cuối trước khi go-live.',
  },
  footer: {
    brand: 'Marvira',
    line: 'Scavenger hunt GPS cho người thích đi bộ khám phá.',
    privacy: 'Quyền riêng tư',
    terms: 'Điều khoản',
    support: 'Hỗ trợ',
  },
  seo: {
    homeTitle: 'Marvira — Scavenger hunt thành phố bằng đôi chân',
    homeDesc:
      'Đi bộ địa điểm thật, trả lời thử thách, leo bảng xếp hạng. Marvira là app scavenger hunt GPS cho người chơi và người tổ chức.',
    howTitle: 'Cách Marvira hoạt động',
    howDesc: 'Tìm hunt, đi tới địa điểm, trả lời thử thách, leo bảng xếp hạng.',
    downloadTitle: 'Tải Marvira',
    downloadDesc: 'Tải Marvira trên App Store hoặc Google Play và bắt đầu khám phá.',
    createTitle: 'Tạo scavenger hunt — Marvira',
    createDesc:
      'Thiết kế hunt GPS cho sự kiện, du lịch, địa điểm và trường học. Tải Marvira để tạo.',
    huntsTitle: 'Hunt thành phố nổi bật — Marvira',
    huntsDesc: 'Xem mẫu scavenger hunt như Downtown Discovery và Golden Gate Adventure.',
    pressTitle: 'Báo chí & đối tác — Marvira',
    pressDesc: 'Marvira dành cho thành phố, địa điểm, trường học và người tổ chức.',
    supportTitle: 'Hỗ trợ & FAQ — Marvira',
    supportDesc: 'Trợ giúp cho người chơi và người tổ chức dùng Marvira.',
    privacyTitle: 'Chính sách quyền riêng tư — Marvira',
    privacyDesc: 'Cách Marvira thu thập, sử dụng và bảo vệ thông tin của bạn.',
    termsTitle: 'Điều khoản dịch vụ — Marvira',
    termsDesc: 'Điều khoản sử dụng app và website Marvira.',
    keywords: [
      'ứng dụng scavenger hunt',
      'scavenger hunt GPS',
      'game khám phá thành phố',
      'quiz đi bộ',
      'team building ngoài trời',
      'scavenger hunt San Francisco',
      'tạo scavenger hunt',
    ],
  },
};

export default vi;
