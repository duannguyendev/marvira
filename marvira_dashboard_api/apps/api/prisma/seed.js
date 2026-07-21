"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var admin, demoUser, event, placesData, _loop_1, _i, placesData_1, place, event2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding database...');
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@marvira.com' },
                            update: {},
                            create: {
                                email: 'admin@marvira.com',
                                name: 'Admin User',
                                provider: client_1.AuthProvider.LOCAL,
                                role: client_1.UserRole.ADMIN,
                            },
                        })];
                case 1:
                    admin = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'demo@marvira.com' },
                            update: {},
                            create: {
                                email: 'demo@marvira.com',
                                name: 'Demo Player',
                                provider: client_1.AuthProvider.LOCAL,
                                role: client_1.UserRole.USER,
                            },
                        })];
                case 2:
                    demoUser = _a.sent();
                    return [4 /*yield*/, prisma.event.upsert({
                            where: { id: 'seed-event-downtown' },
                            update: {},
                            create: {
                                id: 'seed-event-downtown',
                                title: 'Downtown Discovery Hunt',
                                description: 'Explore the historic downtown district and uncover hidden gems through interactive challenges.',
                                city: 'San Francisco',
                                difficulty: client_1.EventDifficulty.MEDIUM,
                                rewardPoints: 250,
                                isActive: true,
                                createdBy: admin.id,
                                coverImage: null,
                            },
                        })];
                case 3:
                    event = _a.sent();
                    placesData = [
                        {
                            id: 'seed-place-1',
                            title: 'Union Square',
                            description: 'The heart of downtown shopping and culture.',
                            latitude: 37.7879,
                            longitude: -122.4075,
                            orderIndex: 0,
                            hint: 'Look for the large plaza with palm trees.',
                        },
                        {
                            id: 'seed-place-2',
                            title: 'Ferry Building',
                            description: 'Historic transit hub turned gourmet marketplace.',
                            latitude: 37.7956,
                            longitude: -122.3933,
                            orderIndex: 1,
                            hint: 'Find the clock tower by the bay.',
                        },
                        {
                            id: 'seed-place-3',
                            title: 'Coit Tower',
                            description: 'Art Deco tower with panoramic city views.',
                            latitude: 37.8024,
                            longitude: -122.4058,
                            orderIndex: 2,
                            hint: 'Climb Telegraph Hill to find this landmark.',
                        },
                    ];
                    _loop_1 = function (place) {
                        var created, questions, q;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, prisma.place.upsert({
                                        where: { id: place.id },
                                        update: {},
                                        create: __assign(__assign({}, place), { eventId: event.id, radiusMeters: 100 }),
                                    })];
                                case 1:
                                    created = _b.sent();
                                    questions = [
                                        {
                                            placeId: 'seed-place-1',
                                            question: 'What year was Union Square dedicated?',
                                            type: client_1.QuestionType.TEXT,
                                            answer: '1850',
                                            explanation: 'Union Square was dedicated in 1850 and named for pro-Union rallies.',
                                            points: 15,
                                        },
                                        {
                                            placeId: 'seed-place-2',
                                            question: 'The Ferry Building clock is modeled after which famous tower?',
                                            type: client_1.QuestionType.MULTIPLE_CHOICE,
                                            options: ['Big Ben', 'Eiffel Tower', 'Leaning Tower', 'CN Tower'],
                                            answer: 'Big Ben',
                                            explanation: 'The clock was inspired by the Giralda tower in Seville, but resembles Big Ben.',
                                            points: 20,
                                        },
                                        {
                                            placeId: 'seed-place-3',
                                            question: 'Coit Tower was built with funds from Lillie Hitchcock Coit.',
                                            type: client_1.QuestionType.TRUE_FALSE,
                                            options: ['True', 'False'],
                                            answer: 'True',
                                            explanation: 'Lillie Hitchcock Coit left funds to beautify San Francisco.',
                                            points: 25,
                                        },
                                    ];
                                    q = questions.find(function (q) { return q.placeId === place.id; });
                                    if (!q) return [3 /*break*/, 3];
                                    return [4 /*yield*/, prisma.question.upsert({
                                            where: { placeId: created.id },
                                            update: {},
                                            create: q,
                                        })];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, placesData_1 = placesData;
                    _a.label = 4;
                case 4:
                    if (!(_i < placesData_1.length)) return [3 /*break*/, 7];
                    place = placesData_1[_i];
                    return [5 /*yield**/, _loop_1(place)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, prisma.event.create({
                        data: {
                            title: 'Golden Gate Adventure',
                            description: 'A scenic hunt along the iconic Golden Gate Bridge area.',
                            city: 'San Francisco',
                            difficulty: client_1.EventDifficulty.HARD,
                            rewardPoints: 400,
                            isActive: true,
                            createdBy: admin.id,
                        },
                    })];
                case 8:
                    event2 = _a.sent();
                    return [4 /*yield*/, prisma.place.create({
                            data: {
                                eventId: event2.id,
                                title: 'Golden Gate Welcome Center',
                                description: 'Start your bridge adventure here.',
                                latitude: 37.8078,
                                longitude: -122.475,
                                orderIndex: 0,
                                radiusMeters: 150,
                                hint: 'Near the south vista point.',
                                question: {
                                    create: {
                                        question: 'What color is the Golden Gate Bridge officially painted?',
                                        type: client_1.QuestionType.TEXT,
                                        answer: 'International Orange',
                                        explanation: 'The official color is International Orange.',
                                        points: 30,
                                    },
                                },
                            },
                        })];
                case 9:
                    _a.sent();
                    console.log('Seed complete!');
                    console.log("Admin: admin@marvira.com / admin123");
                    console.log("Demo user: demo@marvira.com / demo123");
                    console.log("Admin ID: ".concat(admin.id));
                    console.log("Demo user ID: ".concat(demoUser.id));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return prisma.$disconnect(); });
