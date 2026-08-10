import { IMAGES } from '@/lib/site';
import type { MarketingContent } from '@/content/en';

const vi: MarketingContent = {
  brandLine: 'Giải mật thư — khám phá thành phố bằng đôi chân.',
  nav: {
    how: 'Cách chơi',
    explore: 'Khám phá',
    create: 'Tạo cuộc săn',
    download: 'Tải ứng dụng',
    support: 'Hỗ trợ',
    press: 'Báo chí',
  },
  home: {
    headline: 'Biến thành phố thành cuộc giải mật thư ngoài trời.',
    support:
      'Đi bộ tới địa điểm thật, giải mật thư và thử thách, chơi trò chơi lớn cùng bạn bè trên bảng xếp hạng.',
    ctaAppStore: 'App Store',
    ctaPlayStore: 'Google Play',
    ctaDownload: 'Tải ứng dụng',
    ctaComingSoon: 'Sắp ra mắt',
    ctaHow: 'Xem cách chơi',
    heroAlt: 'Mọi người khám phá phố vào giờ hoàng hôn',
    heroImageBrief:
      'Ảnh toàn khung bạn bè đi bộ trên phố / quảng trường lúc hoàng hôn — cảm giác ngoài trời thật, không phải giao diện giả lập.',
  },
  how: {
    title: 'Marvira hoạt động thế nào',
    intro:
      'Bốn bước đơn giản từ tìm một cuộc giải mật thư đến đứng đầu bảng xếp hạng.',
    steps: [
      {
        title: 'Tìm một cuộc săn',
        body: 'Duyệt sự kiện gần bạn — đi bộ trung tâm, công viên và thử thách thành phố đặc biệt.',
      },
      {
        title: 'Đi tới địa điểm',
        body: 'Theo bản đồ tới địa danh thật. GPS sẽ xác nhận khi bạn đến nơi.',
      },
      {
        title: 'Giải mật thư',
        body: 'Trả lời câu hỏi và gợi ý tại mỗi điểm dừng. Không tiết lộ trước — khám phá mới thú vị.',
      },
      {
        title: 'Leo bảng xếp hạng',
        body: 'Kiếm điểm nhờ tốc độ và độ chính xác. Chia sẻ thành tích với bạn bè.',
      },
    ],
  },
  download: {
    title: 'Tải Marvira',
    titleSoon: 'Marvira sắp ra mắt',
    intro: 'Cài trên iOS hoặc Android và bắt đầu cuộc săn đầu tiên.',
    introSoon:
      'Marvira sẽ có trên App Store và Google Play. Liên kết tải sẽ xuất hiện tại đây ngay khi phát hành công khai — hiện chưa có bản cài đặt trên cửa hàng.',
    qrLabel: 'Quét để cài',
    qrLabelSoon: 'Link cửa hàng sắp có',
    storesSoonTitle: 'Chưa có trên App Store và Google Play',
    storesSoon:
      'Cảm ơn bạn đã quan tâm. Chúng tôi đang chuẩn bị phát hành công khai. Vui lòng quay lại sau để lấy liên kết tải chính thức.',
    deepLinkNote:
      'Đã có ứng dụng? Mở liên kết cuộc săn được chia sẻ — Marvira sẽ tự khởi chạy.',
    deepLinkNoteSoon:
      'Sau khi phát hành, liên kết cuộc săn được chia sẻ sẽ mở Marvira nếu bạn đã cài ứng dụng.',
  },
  create: {
    title: 'Tạo cuộc săn cho thành phố của bạn',
    intro:
      'Thiết kế cuộc săn GPS cho sự kiện, đội nhóm, du lịch và trường học — rồi mời người chơi chỉ với một liên kết.',
    props: [
      {
        title: 'Sự kiện & đội nhóm',
        body: 'Gắn kết đội nhóm, sinh nhật và thử thách nhóm giúp mọi người cùng vận động.',
      },
      {
        title: 'Du lịch & địa điểm',
        body: 'Biến khu phố, bảo tàng, khuôn viên thành lộ trình khám phá có thể chơi.',
      },
      {
        title: 'Trường học & học tập',
        body: 'Câu hỏi ngoài trời khuyến khích tò mò, hợp tác và hiểu biết địa phương.',
      },
    ],
    ctaDownload: 'Tải ứng dụng để tạo',
  },
  explore: {
    title: 'Khám phá cuộc săn trong thành phố',
    intro: 'Khám phá các cuộc săn do nhà tổ chức Marvira đăng gần bạn.',
    difficulty: 'Độ khó',
    viewInvite: 'Xem lời mời',
    searchPlaceholder: 'Tìm theo tên hoặc địa điểm…',
    empty: 'Chưa có nội dung nào được đăng. Hãy quay lại sau.',
    noResults: 'Không có kết quả nào khớp với tìm kiếm của bạn.',
    loadError: 'Hiện chưa tải được nội dung. Vui lòng thử lại sau ít phút.',
    readMore: 'Đọc thêm',
    backToExplore: 'Quay lại Khám phá',
    playCta: 'Chơi cuộc săn này trong ứng dụng',
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
        coverBrief:
          'Quảng trường / bến phà / đường chân trời — nhịp sống phố phường sôi động.',
        coverImage: IMAGES.downtown,
      },
      {
        id: 'seed-event-golden-gate',
        title: 'Golden Gate Adventure',
        blurb: 'Cuộc săn phong cảnh dọc khu vực cầu Golden Gate.',
        city: 'San Francisco',
        difficulty: 'Khó',
        coverBrief:
          'Điểm nhìn cầu / đường ven biển — cảm giác đi bộ ngoài trời.',
        coverImage: IMAGES.goldenGate,
      },
    ],
  },
  press: {
    title: 'Marvira là gì?',
    onePager:
      'Marvira là ứng dụng giải mật thư bằng GPS để khám phá thành phố. Người chơi đi tới địa điểm thật, giải thử thách tại chỗ và cạnh tranh trên bảng xếp hạng. Phù hợp hoạt động đoàn đội, đội viên, đoàn viên và nhóm thích đi bộ ngoài trời. Người tổ chức tạo cuộc săn cho sự kiện, du lịch, địa điểm và trường học — rồi chia sẻ một liên kết mời.',
    audiences: [
      {
        title: 'Thành phố & du lịch',
        body: 'Làm sống động khu phố bằng lộ trình khám phá đi bộ, làm nổi bật địa danh địa phương.',
      },
      {
        title: 'Địa điểm & khuôn viên',
        body: 'Mang trải nghiệm tự hướng dẫn mà không cần xây ứng dụng riêng.',
      },
      {
        title: 'Trường học & đoàn đội',
        body: 'Biến lịch sử địa phương và STEM thành thử thách đội nhóm ngoài trời cho đội viên và đoàn viên.',
      },
      {
        title: 'Người tổ chức',
        body: 'Xuất bản cuộc săn, mời người chơi và ăn mừng kết quả trên bảng xếp hạng trực tiếp.',
      },
    ],
    boilerplate:
      'Marvira biến thành phố thành cuộc giải mật thư có thể chơi. Đi bộ tới địa điểm thật, giải thử thách, leo bảng xếp hạng — hoặc tạo cuộc săn cho cộng đồng của bạn.',
    downloadPdf: 'Tải PDF một trang',
  },
  support: {
    title: 'Hỗ trợ & FAQ',
    intro: 'Câu hỏi thường gặp cho người chơi và người tổ chức.',
    faqs: [
      {
        q: 'Tôi có cần tài khoản để chơi không?',
        a: 'Có — đăng nhập trong ứng dụng để tiến độ và điểm bảng xếp hạng gắn với bạn.',
      },
      {
        q: 'Xác nhận vị trí hoạt động thế nào?',
        a: 'Khi bạn đến gần địa điểm, Marvira dùng GPS để xác nhận. Hãy ở ngoài trời và bật quyền vị trí.',
      },
      {
        q: 'Tôi có thể tự tạo cuộc săn không?',
        a: 'Có. Tài khoản miễn phí có thể soạn thảo thoải mái và xuất bản số sự kiện giới hạn. Marvira Plus mở khóa số cuộc săn đã xuất bản không giới hạn.',
      },
      {
        q: 'Liên kết sự kiện có mở ứng dụng không?',
        a: 'Khi ứng dụng lên cửa hàng, liên kết dạng /e/{id} sẽ mở Marvira nếu đã cài, hoặc đưa bạn tới trang tải.',
      },
      {
        q: 'Làm sao liên hệ hỗ trợ?',
        a: 'Dùng biểu mẫu phản hồi bên dưới — chúng tôi đọc mọi tin nhắn. Bạn cũng có thể gửi email {{supportEmail}}.',
      },
    ],
    form: {
      title: 'Gửi tin nhắn cho chúng tôi',
      intro: 'Chia sẻ phản hồi, đề xuất hoặc báo lỗi. Không cần tài khoản.',
      nameLabel: 'Tên của bạn',
      emailLabel: 'Email',
      categoryLabel: 'Danh mục',
      subjectLabel: 'Tiêu đề (tùy chọn)',
      messageLabel: 'Nội dung',
      submit: 'Gửi tin nhắn',
      submitting: 'Đang gửi…',
      success: 'Cảm ơn! Tin nhắn của bạn đã được gửi.',
      error: 'Không gửi được tin nhắn. Vui lòng thử lại.',
      categories: {
        feedback: 'Phản hồi',
        suggestion: 'Đề xuất',
        bug: 'Báo lỗi',
        other: 'Khác',
      },
    },
  },
  event: {
    joinCta: 'Tham gia cuộc săn này',
    downloadCta: 'Tải Marvira',
    downloadCtaSoon: 'Ứng dụng sắp ra mắt',
    when: 'Khi nào',
    where: 'Ở đâu',
    how: 'Cách tham gia',
    howBody:
      'Cài Marvira, mở lại liên kết mời này, rồi bắt đầu đi. Đáp án và tọa độ chính xác chỉ có trong ứng dụng — không tiết lộ tại đây.',
    howBodySoon:
      'Khi Marvira có trên App Store và Google Play, cài ứng dụng, mở lại liên kết mời này, rồi bắt đầu đi. Đáp án và tọa độ chính xác chỉ có trong ứng dụng — không tiết lộ tại đây.',
    joinHint: 'Mở trong ứng dụng nếu đã cài, hoặc tải Marvira trước.',
    joinHintSoon:
      'Ứng dụng chưa lên cửa hàng. Xem trang tải để theo dõi thông tin phát hành.',
    leaderboardEmpty: 'Bảng xếp hạng mở khi cuộc săn bắt đầu.',
    leaderboardLive: 'Điểm cập nhật khi người chơi hoàn thành địa điểm.',
    leaderboardEnded: 'Kết quả cuối — cảm ơn đã chơi.',
    notFound: 'Lời mời cuộc săn này không khả dụng.',
  },
  legal: {
    privacyTitle: 'Chính sách quyền riêng tư',
    termsTitle: 'Điều khoản dịch vụ',
    updated: 'Cập nhật lần cuối: 7 tháng 8, 2026',
    counselNote:
      'Bản nháp phục vụ sản phẩm và cửa hàng ứng dụng. Cần luật sư rà soát cuối trước khi chính thức phát hành.',
  },
  footer: {
    brand: 'Marvira',
    line: 'Giải mật thư GPS cho đội nhóm và người thích đi bộ khám phá.',
    privacy: 'Quyền riêng tư',
    terms: 'Điều khoản',
    support: 'Hỗ trợ',
  },
  seo: {
    homeTitle: 'Marvira — Giải mật thư ngoài trời | Trò chơi lớn khám phá thành phố',
    homeDesc:
      'Marvira là ứng dụng giải mật thư GPS ngoài trời: đi tới địa điểm thật, giải thử thách và chơi trò chơi lớn cùng đội nhóm — phù hợp hoạt động đoàn đội, đội viên, đoàn viên và người thích đi bộ, chạy bộ, khám phá.',
    howTitle: 'Cách Marvira hoạt động',
    howDesc:
      'Tìm cuộc săn, đi tới địa điểm, giải mật thư tại chỗ và leo bảng xếp hạng.',
    downloadTitle: 'Tải Marvira',
    downloadDesc:
      'Marvira sắp có trên App Store và Google Play — ứng dụng giải mật thư GPS để khám phá thành phố.',
    createTitle: 'Tạo cuộc giải mật thư — Marvira',
    createDesc:
      'Thiết kế cuộc giải mật thư GPS cho sự kiện, đoàn đội, du lịch và trường học.',
    huntsTitle: 'Cuộc giải mật thư thành phố — Marvira',
    huntsDesc:
      'Khám phá các cuộc giải mật thư do nhà tổ chức Marvira đăng gần bạn.',
    pressTitle: 'Báo chí & đối tác — Marvira',
    pressDesc:
      'Marvira — giải mật thư ngoài trời cho thành phố, địa điểm, trường học và người tổ chức.',
    supportTitle: 'Hỗ trợ & FAQ — Marvira',
    supportDesc: 'Trợ giúp cho người chơi và người tổ chức dùng Marvira.',
    privacyTitle: 'Chính sách quyền riêng tư — Marvira',
    privacyDesc: 'Cách Marvira thu thập, sử dụng và bảo vệ thông tin của bạn.',
    termsTitle: 'Điều khoản dịch vụ — Marvira',
    termsDesc: 'Điều khoản sử dụng ứng dụng và website Marvira.',
    keywords: [
      'mật thư',
      'giải mật thư',
      'trò chơi lớn',
      'game cho hoạt động đoàn đội',
      'trò chơi cho đội viên',
      'trò chơi cho đoàn viên',
      'game đoàn đội',
      'trò chơi chạy bộ',
      'trò chơi khám phá ngoài trời',
    ],
  },
};

export default vi;
