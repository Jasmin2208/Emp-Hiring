const { validationResult } = require("express-validator");
const { knex } = require("../database/db");
const { response, capitalizeFirstLetter, formatDate } = require("../helpers/helper");
const { ErrorHandler, TryCatch } = require("../middleware/error");

const getLookupLists = async (knex, roleId) => {
    const lookupTypes = [
        { key: 'maritalStatusOptions', type: 'marital' },
        { key: 'bloodGroupOptions', type: 'bloodGroup' },
        { key: 'degreeOptions', type: 'degree' },
        { key: 'universityOptions', type: 'university' },
        { key: 'stateOptions', type: 'state' },
        { key: 'addressTypeOptions', type: 'addrtype' },
        { key: 'relationOptions', type: 'relation' }
    ];

    const lookupPromises = lookupTypes.map(({ key, type }) =>
        knex('commonLookup').select('id', 'code as value').where('type', type)
            .then(data => ({ [key]: data }))
    );

    const userRolePromise = knex('commonLookup')
        .select('code as value')
        .where({ type: 'role', id: roleId })
        .first()
        .then(role => ({ userRole: role }));

    // Execute all queries in parallel
    const results = await Promise.all([...lookupPromises, userRolePromise]);

    // Merge results into a single object
    return Object.assign({}, ...results);
};

// Extract Values Using Lookup Lists
const findValue = (list, id) => id ? list.find(item => item.id === id)?.value || null : null;

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

    // Fetch Lookup Data
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
                value: persInfo?.marital ? capitalizeFirstLetter(findValue(lookupData.maritalStatusOptions, persInfo.marital)) : null,
                ddValue: lookupData.maritalStatusOptions,
                isEditable: true
            },
            bloodGroup: {
                value: persInfo?.bloodGroup ? capitalizeFirstLetter(findValue(lookupData.bloodGroupOptions, persInfo?.bloodGroup)) : null,
                ddValue: lookupData.bloodGroupOptions,
                isEditable: true
            }
        },
        educationInfo: {
            degree: {
                value: findValue(lookupData.degreeOptions, eduInfo?.degree),
                ddValue: lookupData.degreeOptions,
                isEditable: true
            },
            university: {
                value: findValue(lookupData.universityOptions, eduInfo?.university),
                ddValue: lookupData.universityOptions,
                isEditable: true
            },
            city: {
                value: eduInfo?.city || null,
                isEditable: true
            },
            state: {
                value: findValue(lookupData.stateOptions, eduInfo?.state),
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
                value: addrInfo?.addrType ? capitalizeFirstLetter(findValue(lookupData.addressTypeOptions, addrInfo?.addrType)) : null,
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
                value: findValue(lookupData.stateOptions, addrInfo?.state),
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
                value: findValue(lookupData.stateOptions, exprInfo?.state),
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
                value: findValue(lookupData.relationOptions, famiInfo?.relationship),
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

module.exports = getUserDetails;


// const getUserDetails = TryCatch(async (req, res, next) => {
//     const userId = req.user.id;

//     const empInfo = await knex('emp_info').where('id', userId).first();
//     const famiInfo = await knex('fami_info').where('empId', userId).first();
//     const addrInfo = await knex('addr_info').where('empId', userId).first();
//     const persInfo = await knex('pers_info').where('empId', userId).first();
//     const eduInfo = await knex('edu_info').where('empId', userId).first();
//     const exprInfo = await knex('expr_info').where('empId', userId).first();
//     const maritalList = await knex('commonLookup').select('id', 'code as value').where('type', 'marital');
//     const bloodGroupList = await knex('commonLookup').select('id', 'code as value').where('type', 'bloodGroup');
//     const degreeList = await knex('commonLookup').select('id', 'code as value').where('type', 'degree');
//     const universityList = await knex('commonLookup').select('id', 'code as value').where('type', 'university');
//     const stateList = await knex('commonLookup').select('id', 'code as value').where('type', 'state');
//     const addressTypeList = await knex('commonLookup').select('id', 'code as value').where('type', 'addrtype');
//     const relationList = await knex('commonLookup').select('id', 'code as value').where('type', 'relation');
//     const userRole = await knex('commonLookup').select('code as value').where({ type: 'role', id: empInfo.roleId }).first();

//     const userMaritalStatus = persInfo?.marital
//         ? maritalList.find(marital => marital.id === persInfo.marital)?.value || null
//         : null;

//     const userBloodGroup = persInfo?.bloodGroup
//         ? bloodGroupList.find(bloodGroup => bloodGroup.id === persInfo.bloodGroup)?.value || null
//         : null;

//     const userEduDegree = eduInfo?.degree
//         ? degreeList.find(degree => degree.id === eduInfo.degree)?.value || null
//         : null;

//     const userEduUniversity = eduInfo?.university
//         ? universityList.find(university => university.id === eduInfo.university)?.value || null
//         : null;

//     const userEduState = eduInfo?.state
//         ? stateList.find(state => state.id === eduInfo.state)?.value || null
//         : null;

//     const userAddressType = addrInfo?.addrType
//         ? addressTypeList.find(addrType => addrType.id === eduInfo.addrType)?.value || null
//         : null;

//     const userAddrState = addrInfo?.state
//         ? stateList.find(state => state.id === addrInfo.state)?.value || null
//         : null;

//     const userExprState = exprInfo?.state
//         ? stateList.find(state => state.id === exprInfo.state)?.value || null
//         : null;

//     const userFamiRelation = famiInfo?.relationship
//         ? relationList.find(relationship => relationship.id === famiInfo.relationship)?.value || null
//         : null;

//     const userDetails = {
//         userInfo: {
//             welcomeText: "Welcome to Register",
//             name: `${empInfo.firstName} ${empInfo.lastName}`,
//             role: userRole ? capitalizeFirstLetter(userRole.value) : null
//         },
//         personalInfo: {
//             aadhaarNo: {
//                 value: persInfo?.aadhaarNo ? persInfo.aadhaarNo : null,
//                 isEditable: true
//             },
//             phone: {
//                 value: empInfo?.phone ? empInfo.phone : null,
//                 isEditable: true
//             },
//             email: {
//                 value: empInfo?.email ? empInfo.email : null,
//                 isEditable: false
//             },
//             pan: {
//                 value: persInfo?.pan ? persInfo.pan : null,
//                 isEditable: true
//             },
//             dob: {
//                 value: empInfo?.dob ? formatDate(empInfo.dob) : null,
//                 isEditable: true
//             },
//             marital: {
//                 value: userMaritalStatus ? capitalizeFirstLetter(userMaritalStatus) : null,
//                 ddValue: maritalList,
//                 isEditable: true
//             },
//             bloodGroup: {
//                 value: userBloodGroup ? capitalizeFirstLetter(userBloodGroup) : null,
//                 ddValue: bloodGroupList,
//                 isEditable: true
//             }
//         },
//         educationInfo: {
//             degree: {
//                 value: userEduDegree ? userEduDegree : null,
//                 ddValue: degreeList,
//                 isEditable: true
//             },
//             university: {
//                 value: userEduUniversity ? userEduUniversity : null,
//                 ddValue: universityList,
//                 isEditable: true
//             },
//             city: {
//                 value: eduInfo?.city ? eduInfo.city : null,
//                 isEditable: true
//             },
//             state: {
//                 value: userEduState ? userEduState : null,
//                 ddValue: stateList,
//                 isEditable: true
//             },
//             pincode: {
//                 value: eduInfo?.pincode ? eduInfo.pincode : null,
//                 isEditable: true
//             },
//             startYear: {
//                 value: eduInfo?.startYear ? formatDate(eduInfo.startYear) : null,
//                 isEditable: true
//             },
//             endYear: {
//                 value: eduInfo?.endYear ? formatDate(eduInfo.endYear) : null,
//                 isEditable: true
//             },
//         },
//         addressInfo: {
//             addrType: {
//                 value: userAddressType ? capitalizeFirstLetter(userAddressType) : null,
//                 ddValue: addressTypeList,
//                 isEditable: true
//             },
//             addr1: {
//                 value: addrInfo?.addr1 ? addrInfo.addr1 : null,
//                 isEditable: true
//             },
//             addr2: {
//                 value: addrInfo?.addr2 ? addrInfo.addr2 : null,
//                 isEditable: true
//             },
//             addr3: {
//                 value: addrInfo?.addr3 ? addrInfo.addr3 : null,
//                 isEditable: true
//             },
//             city: {
//                 value: addrInfo?.city ? addrInfo.city : null,
//                 isEditable: true
//             },
//             state: {
//                 value: userAddrState ? userAddrState : null,
//                 ddValue: stateList,
//                 isEditable: true
//             },
//             pincode: {
//                 value: addrInfo?.pincode ? addrInfo.pincode : null,
//                 isEditable: true
//             },
//         },
//         experienceInfo: {
//             name: {
//                 value: exprInfo?.name ? addrInfo.name : null,
//                 isEditable: true
//             },
//             role: {
//                 value: exprInfo?.role ? addrInfo.role : null,
//                 isEditable: true
//             },
//             city: {
//                 value: exprInfo?.city ? exprInfo.city : null,
//                 isEditable: true
//             },
//             state: {
//                 value: userExprState ? userExprState : null,
//                 ddValue: stateList,
//                 isEditable: true
//             },
//             pincode: {
//                 value: exprInfo?.pincode ? exprInfo.pincode : null,
//                 isEditable: true
//             },
//             startYear: {
//                 value: exprInfo?.startYear ? formatDate(exprInfo.startYear) : null,
//                 isEditable: true
//             },
//             endYear: {
//                 value: exprInfo?.endYear ? formatDate(exprInfo.endYear) : null,
//                 isEditable: true
//             },
//         },
//         familyInfo: {
//             relationship: {
//                 value: userFamiRelation ? userFamiRelation : null,
//                 ddValue: relationList,
//                 isEditable: true
//             },
//             firstName: {
//                 value: famiInfo?.firstName ? addrInfo.firstName : null,
//                 isEditable: true
//             },
//             middleName: {
//                 value: famiInfo?.middleName ? addrInfo.middleName : null,
//                 isEditable: true
//             },
//             lastName: {
//                 value: famiInfo?.lastName ? addrInfo.lastName : null,
//                 isEditable: true
//             },
//             phone: {
//                 value: famiInfo?.phone ? addrInfo.phine : null,
//                 isEditable: true
//             },
//         }
//     }

//     response(res, 200, false, 'User details get successfully.', userDetails);
// })

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

    // Fetch Lookup Data
    const lookupData = await getLookupLists(knex, user.roleId);
    const maritalStatusValue = findValue(lookupData.maritalStatusOptions, marital);
    if (!maritalStatusValue) {
        return next(new ErrorHandler("Invalid marital status provided. Please select a valid option.", 400));
    }

    const relationValue = findValue(lookupData.bloodGroupOptions, bloodGroup);
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

    // Fetch Lookup Data
    const lookupData = await getLookupLists(knex, user.roleId);
    const degreeValue = findValue(lookupData.degreeOptions, degree);
    if (!degreeValue) {
        return next(new ErrorHandler("Invalid degree provided. Please select a valid option.", 400));
    }

    const universityValue = findValue(lookupData.universityOptions, university);
    if (!universityValue) {
        return next(new ErrorHandler("Invalid university provided. Please select a valid option.", 400));
    }

    const stateValue = findValue(lookupData.stateOptions, state);
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

    // Fetch Lookup Data
    const lookupData = await getLookupLists(knex, user.roleId);
    const relationValue = findValue(lookupData.relationOptions, relationship);
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

module.exports = { getUserDetails, updateUserPersonalInfo, updateUserEducationInfo, updateUserFamilyInfo }