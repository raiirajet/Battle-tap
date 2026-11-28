# RC67–71 character refinement
RC67: individual finger curl/spread and nail edge detail; preserves existing 42-bone rig.
RC68: procedural geometric garment folds around waist and shoulders in detailed mode.
RC69: distinct local torso proportions in addition to existing global body scaling.
RC70: distance-driven gait for the articulated animation, ankle pivots and greeting hand pose. The skinned clip mixer still uses its existing time-based animation.
RC71: analytic two-segment sagittal leg IK after animation for the outdoor detailed player, sampled terrain and bounded ankle compensation. This is not world-space locked-foot IK, not applied inside buildings or to NPCs; device and visual tuning remain outstanding.
Automated tests cover gesture bounds, torso profile, IK reconstruction and finite transforms.
