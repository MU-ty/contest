"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCategory = exports.ContentType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["TEACHER"] = "teacher";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ContentType;
(function (ContentType) {
    ContentType["TEXT"] = "text";
    ContentType["IMAGE"] = "image";
    ContentType["AUDIO"] = "audio";
    ContentType["VIDEO"] = "video";
    ContentType["DOCUMENT"] = "document";
    ContentType["PRESENTATION"] = "presentation";
    ContentType["INTERACTIVE"] = "interactive";
})(ContentType || (exports.ContentType = ContentType = {}));
var ResourceCategory;
(function (ResourceCategory) {
    ResourceCategory["LESSON_PLAN"] = "lesson_plan";
    ResourceCategory["EXERCISE"] = "exercise";
    ResourceCategory["QUIZ"] = "quiz";
    ResourceCategory["MATERIAL"] = "material";
    ResourceCategory["REFERENCE"] = "reference";
    ResourceCategory["MULTIMEDIA"] = "multimedia";
})(ResourceCategory || (exports.ResourceCategory = ResourceCategory = {}));
//# sourceMappingURL=types.js.map