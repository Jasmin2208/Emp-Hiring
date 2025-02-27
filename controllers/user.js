const { validationResult } = require("express-validator");
const { knex } = require("../database/db");
const { response, capitalizeFirstLetter, formatDate, getLookupLists, findValueFromLookupList } = require("../helpers/helper");
const { ErrorHandler, TryCatch } = require("../middleware/error");

const getUserDetails = TryCatch(async (req, res, next) => {
    const userId = req.user.id;

    // Fetch Employee Information
    const [empInfo, famiInfo, addrInfo, persInfo, eduInfo, exprInfo] = await Promise.all([
        knex('emp_info').where('id', userId).first(),
        knex('fami_info').where('empId', userId).first(),
        knex('addr_info').where('empId', userId).first(),
        knex('pers_info').where('empId', userId).first(),
        knex('edu_info').where('empId', userId).first(),
        knex('expr_info').where('empId', userId).first()
    ]);

    if (!empInfo) return response(res, 404, true, "User not found.");

    const lookupData = await getLookupLists(knex, empInfo.roleId);

    const userDetails = {
        userInfo: {
            welcomeText: "Welcome to Register",
            name: `${empInfo.firstName} ${empInfo.lastName}`,
            role: lookupData.userRole ? capitalizeFirstLetter(lookupData.userRole.value) : null
        },
        personalInfo: {
            aadhaarNo: {
                value: persInfo?.aadhaarNo || null,
                isEditable: true
            },
            phone: {
                value: empInfo?.phone || null,
                isEditable: true
            },
            email: {
                value: empInfo?.email || null,
                isEditable: false
            },
            pan: {
                value: persInfo?.pan || null,
                isEditable: true
            },
            dob: {
                value: empInfo?.dob ? formatDate(empInfo.dob) : null,
                isEditable: true
            },
            marital: {
                value: persInfo?.marital ? capitalizeFirstLetter(findValueFromLookupList(lookupData.maritalStatusOptions, persInfo.marital)) : null,
                ddValue: lookupData.maritalStatusOptions,
                isEditable: true
            },
            bloodGroup: {
                value: persInfo?.bloodGroup ? capitalizeFirstLetter(findValueFromLookupList(lookupData.bloodGroupOptions, persInfo?.bloodGroup)) : null,
                ddValue: lookupData.bloodGroupOptions,
                isEditable: true
            }
        },
        educationInfo: {
            degree: {
                value: findValueFromLookupList(lookupData.degreeOptions, eduInfo?.degree),
                ddValue: lookupData.degreeOptions,
                isEditable: true
            },
            college: {
                value: eduInfo?.college || null,
                isEditable: true
            },
            university: {
                value: findValueFromLookupList(lookupData.universityOptions, eduInfo?.university),
                ddValue: lookupData.universityOptions,
                isEditable: true
            },
            city: {
                value: eduInfo?.city || null,
                isEditable: true
            },
            state: {
                value: findValueFromLookupList(lookupData.stateOptions, eduInfo?.state),
                ddValue: lookupData.stateOptions,
                isEditable: true
            },
            pincode: {
                value: eduInfo?.pincode || null,
                isEditable: true
            },
            startYear: {
                value: eduInfo?.startYear ? formatDate(eduInfo.startYear) : null,
                isEditable: true
            },
            endYear: {
                value: eduInfo?.endYear ? formatDate(eduInfo.endYear) : null,
                isEditable: true
            }
        },
        addressInfo: {
            addrType: {
                value: addrInfo?.addrType ? capitalizeFirstLetter(findValueFromLookupList(lookupData.addressTypeOptions, addrInfo?.addrType)) : null,
                ddValue: lookupData.addressTypeOptions,
                isEditable: true
            },
            addr1: {
                value: addrInfo?.addr1 || null,
                isEditable: true
            },
            addr2: {
                value: addrInfo?.addr2 || null,
                isEditable: true
            },
            addr3: {
                value: addrInfo?.addr3 || null,
                isEditable: true
            },
            city: {
                value: addrInfo?.city || null,
                isEditable: true
            },
            state: {
                value: findValueFromLookupList(lookupData.stateOptions, addrInfo?.state),
                ddValue: lookupData.stateOptions,
                isEditable: true
            },
            pincode: {
                value: addrInfo?.pincode || null,
                isEditable: true
            }
        },
        experienceInfo: {
            name: {
                value: exprInfo?.name || null,
                isEditable: true
            },
            role: {
                value: exprInfo?.role || null,
                isEditable: true
            },
            city: {
                value: exprInfo?.city || null,
                isEditable: true
            },
            state: {
                value: findValueFromLookupList(lookupData.stateOptions, exprInfo?.state),
                ddValue: lookupData.stateOptions,
                isEditable: true
            },
            pincode: {
                value: exprInfo?.pincode || null,
                isEditable: true
            },
            startYear: {
                value: exprInfo?.startYear ? formatDate(exprInfo.startYear) : null,
                isEditable: true
            },
            endYear: {
                value: exprInfo?.endYear ? formatDate(exprInfo.endYear) : null,
                isEditable: true
            }
        },
        familyInfo: {
            relationship: {
                value: findValueFromLookupList(lookupData.relationOptions, famiInfo?.relationship),
                ddValue: lookupData.relationOptions,
                isEditable: true
            },
            firstName: {
                value: famiInfo?.firstName || null,
                isEditable: true
            },
            middleName: {
                value: famiInfo?.middleName || null,
                isEditable: true
            },
            lastName: {
                value: famiInfo?.lastName || null,
                isEditable: true
            },
            phone: {
                value: famiInfo?.phone || null,
                isEditable: true
            }
        }
    };

    response(res, 200, false, 'User details retrieved successfully.', userDetails);
});

const updateUserPersonalInfo = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg, });
    }

    const { aadhaarNo, pan, marital, bloodGroup, phone, dob } = req.body;
    const userId = req.user.id;

    const user = await knex("emp_info").where({ id: userId }).first();
    if (!user) {
        return next(new ErrorHandler("User not found. Please check your credentials and try again.", 404));
    }

    const lookupData = await getLookupLists(knex, user.roleId);
    const maritalStatusValue = findValueFromLookupList(lookupData.maritalStatusOptions, marital);
    if (!maritalStatusValue) {
        return next(new ErrorHandler("Invalid marital status provided. Please select a valid option.", 400));
    }

    const relationValue = findValueFromLookupList(lookupData.bloodGroupOptions, bloodGroup);
    if (!relationValue) {
        return next(new ErrorHandler("Invalid blood group provided. Please select a valid option.", 400));
    }

    const userDetail = {
        phone,
        dob,
    };

    const personalDetail = {
        empId: userId,
        aadhaarNo,
        pan,
        marital,
        bloodGroup
    }

    await knex("emp_info").update(userDetail).where('id', userId);

    const existingPersonalInfo = await knex("pers_info").where('empId', userId).first();
    if (existingPersonalInfo) {
        await knex("pers_info").where('empId', userId).update(personalDetail)
    } else {
        await knex("pers_info").insert(personalDetail)
    }

    const personalInfo = {
        aadhaarNo: {
            value: aadhaarNo,
            isEditable: true
        },
        phone: {
            value: phone,
            isEditable: true
        },
        email: {
            value: user.email,
            isEditable: false
        },
        pan: {
            value: pan,
            isEditable: true
        },
        dob: {
            value: formatDate(dob),
            isEditable: true
        },
        marital: {
            value: maritalStatusValue,
            ddValue: lookupData.maritalStatusOptions,
            isEditable: true
        },
        bloodGroup: {
            value: relationValue,
            ddValue: lookupData.bloodGroupOptions,
            isEditable: true
        }
    }

    return response(res, 200, false, 'User personal detail updated successfully.', { personalInfo });
});

const updateUserAddressInfo = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg, });
    }

    const { addrType, addr1, addr2, addr3, city, state, pincode } = req.body;
    const userId = req.user.id;

    const user = await knex("emp_info").where({ id: userId }).first();
    if (!user) {
        return next(new ErrorHandler("User not found. Please check your credentials and try again.", 404));
    }

    const lookupData = await getLookupLists(knex, user.roleId);
    const addressTypeValue = findValueFromLookupList(lookupData.addressTypeOptions, addrType);
    if (!addressTypeValue) {
        return next(new ErrorHandler("Invalid address type provided. Please select a valid option.", 400));
    }

    const stateValue = findValueFromLookupList(lookupData.stateOptions, state);
    if (!stateValue) {
        return next(new ErrorHandler("Invalid state provided. Please select a valid option.", 400));
    }

    const educationDetail = {
        ...req.body,
        empId: userId,
    }

    const existingAddressInfo = await knex("addr_info").where('empId', userId).first();
    if (existingAddressInfo) {
        await knex("addr_info").where('empId', userId).update(educationDetail)
    } else {
        await knex("addr_info").insert(educationDetail)
    }

    const addressInfo = {
        addrtype: {
            value: capitalizeFirstLetter(addressTypeValue),
            ddValue: lookupData.addressTypeOptions,
            isEditable: true
        },
        addr1: {
            value: addr1,
            isEditable: true
        },
        addr2: {
            value: addr2,
            isEditable: true
        },
        addr3: {
            value: addr3,
            isEditable: true
        },
        city: {
            value: city,
            isEditable: true
        },
        state: {
            value: capitalizeFirstLetter(stateValue),
            ddValue: lookupData.stateOptions,
            isEditable: true
        },
        pincode: {
            value: pincode,
            isEditable: true
        },
    }

    return response(res, 200, false, 'User address detail updated successfully.', { addressInfo });
});

const updateUserFamilyInfo = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg, });
    }

    const { relationship, firstName, middleName, lastName, phone } = req.body;
    const userId = req.user.id;

    const user = await knex("emp_info").where({ id: userId }).first();
    if (!user) {
        return next(new ErrorHandler("User not found. Please check your credentials and try again.", 404));
    }

    const lookupData = await getLookupLists(knex, user.roleId);
    const relationValue = findValueFromLookupList(lookupData.relationOptions, relationship);
    if (!relationValue) {
        return next(new ErrorHandler("Invalid relationship provided. Please select a valid option.", 400));
    }

    const familyDetail = {
        ...req.body,
        empId: userId,
    }

    const existingFamilyInfo = await knex("fami_info").where('empId', userId).first();
    if (existingFamilyInfo) {
        await knex("fami_info").where('empId', userId).update(familyDetail)
    } else {
        await knex("fami_info").insert(familyDetail)
    }

    const familyInfo = {
        relationship: {
            value: capitalizeFirstLetter(relationValue),
            ddValue: lookupData.relationOptions,
            isEditable: true
        },
        firstName: {
            value: firstName,
            isEditable: true
        },
        middleName: {
            value: middleName,
            isEditable: true
        },
        lastName: {
            value: lastName,
            isEditable: true
        },
        phone: {
            value: phone,
            isEditable: true
        },
    }

    return response(res, 200, false, 'User family detail updated successfully.', { familyInfo });
});

const updateUserEducationInfo = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg, });
    }

    const { degree, college, university, city, state, pincode, startYear, endYear } = req.body;
    const userId = req.user.id;

    const user = await knex("emp_info").where({ id: userId }).first();
    if (!user) {
        return next(new ErrorHandler("User not found. Please check your credentials and try again.", 404));
    }

    const lookupData = await getLookupLists(knex, user.roleId);
    const degreeValue = findValueFromLookupList(lookupData.degreeOptions, degree);
    if (!degreeValue) {
        return next(new ErrorHandler("Invalid degree provided. Please select a valid option.", 400));
    }

    const universityValue = findValueFromLookupList(lookupData.universityOptions, university);
    if (!universityValue) {
        return next(new ErrorHandler("Invalid university provided. Please select a valid option.", 400));
    }

    const stateValue = findValueFromLookupList(lookupData.stateOptions, state);
    if (!stateValue) {
        return next(new ErrorHandler("Invalid state provided. Please select a valid option.", 400));
    }

    const educationDetail = {
        ...req.body,
        empId: userId,
    }

    const existingEducationInfo = await knex("edu_info").where('empId', userId).first();
    if (existingEducationInfo) {
        await knex("edu_info").where('empId', userId).update(educationDetail)
    } else {
        await knex("edu_info").insert(educationDetail)
    }

    const educationInfo = {
        degree: {
            value: capitalizeFirstLetter(degreeValue),
            ddValue: lookupData.degreeOptions,
            isEditable: true
        },
        college: {
            value: college,
            isEditable: true
        },
        university: {
            value: capitalizeFirstLetter(universityValue),
            ddValue: lookupData.universityOptions,
            isEditable: true
        },
        city: {
            value: city,
            isEditable: true
        },
        state: {
            value: capitalizeFirstLetter(stateValue),
            ddValue: lookupData.stateOptions,
            isEditable: true
        },
        pincode: {
            value: pincode,
            isEditable: true
        },
        startYear: {
            value: formatDate(startYear),
            isEditable: true
        },
        endYear: {
            value: formatDate(endYear),
            isEditable: true
        },
    }

    return response(res, 200, false, 'User education detail updated successfully.', { educationInfo });
});

const updateUserExperienceInfo = TryCatch(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: "fail", message: errors.array()[0].msg, });
    }

    const { name, role, city, state, pincode, startYear, endYear } = req.body;
    const userId = req.user.id;

    const user = await knex("emp_info").where({ id: userId }).first();
    if (!user) {
        return next(new ErrorHandler("User not found. Please check your credentials and try again.", 404));
    }

    const lookupData = await getLookupLists(knex, user.roleId);
    const stateValue = findValueFromLookupList(lookupData.stateOptions, state);
    if (!stateValue) {
        return next(new ErrorHandler("Invalid state provided. Please select a valid option.", 400));
    }

    const educationDetail = {
        ...req.body,
        empId: userId,
    }

    const existingExperienceInfo = await knex("expr_info").where('empId', userId).first();
    if (existingExperienceInfo) {
        await knex("expr_info").where('empId', userId).update(educationDetail)
    } else {
        await knex("expr_info").insert(educationDetail)
    }

    const experienceInfo = {
        name: {
            value: name,
            isEditable: true
        },
        role: {
            value: role,
            isEditable: true
        },
        city: {
            value: city,
            isEditable: true
        },
        state: {
            value: capitalizeFirstLetter(stateValue),
            ddValue: lookupData.stateOptions,
            isEditable: true
        },
        pincode: {
            value: pincode,
            isEditable: true
        },
        startYear: {
            value: formatDate(startYear),
            isEditable: true
        },
        endYear: {
            value: formatDate(endYear),
            isEditable: true
        },
    }

    return response(res, 200, false, 'User experience detail updated successfully.', { experienceInfo });
});

module.exports = { getUserDetails, updateUserPersonalInfo, updateUserFamilyInfo, updateUserAddressInfo, updateUserEducationInfo, updateUserExperienceInfo }